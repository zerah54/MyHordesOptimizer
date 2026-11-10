<?php

declare(strict_types=1);

namespace MyHordesOptimizer\Extractor;

use PhpParser\Node;
use PhpParser\Node\Arg;
use PhpParser\Node\Expr;
use PhpParser\Node\Expr\ArrayDimFetch;
use PhpParser\Node\Expr\Assign;
use PhpParser\Node\Expr\BinaryOp\Coalesce;
use PhpParser\Node\Expr\BinaryOp\Identical;
use PhpParser\Node\Expr\ClassConstFetch;
use PhpParser\Node\Expr\Match_;
use PhpParser\Node\Expr\MethodCall;
use PhpParser\Node\Expr\NullsafeMethodCall;
use PhpParser\Node\Expr\PropertyFetch;
use PhpParser\Node\Expr\UnaryMinus;
use PhpParser\Node\Expr\Variable;
use PhpParser\Node\Identifier;
use PhpParser\Node\MatchArm;
use PhpParser\Node\Scalar\Float_;
use PhpParser\Node\Scalar\Int_;
use PhpParser\Node\Scalar\String_;
use PhpParser\Node\Stmt\ClassMethod;
use PhpParser\Node\Stmt\ElseIf_;
use PhpParser\Node\Stmt\If_;
use PhpParser\NodeFinder;
use PhpParser\Parser;
use PhpParser\ParserFactory;
use PhpParser\PhpVersion;
use RuntimeException;

/**
 * Lecture des effets d'évolution des chantiers dans le CODE PHP de MyHordes, sans l'exécuter.
 *
 * Ces valeurs par niveau ne sont pas dans les fixtures : elles sont écrites dans des `match` du code
 * du jeu. Trois formes sont reconnues :
 * - `BuildingUpgradeListener` : `$event->X = match (…getName()) { 'uid' => [v0, v1, …][niveau] ?? défaut, … }` ;
 * - `BuildingQueryListener` : `BuildingValueQuery::Y => match (…getBuilding(…, 'uid', …)?->getLevel() …) { 0 => v, 1, 2 => v, default => d }` ;
 * - `TownHandler` : `if (…getName() === 'uid') { $z = match (…getLevel()) { … } }`.
 * Toute autre forme rencontrée sur ces chemins est listée dans `ignores()` plutôt qu'interprétée :
 * le rapport de l'extracteur rend visible un changement de structure en amont.
 *
 * Analyse en syntaxe PHP 8.4 quelle que soit la version de PHP qui exécute l'extracteur.
 */
final class UpgradeEffectsReader
{
    public const LISTENER_EVOLUTION = 'src/EventListener/Game/Town/Basic/Buildings/BuildingUpgradeListener.php';
    public const LISTENER_VALEURS = 'src/EventListener/Game/Town/Basic/Buildings/BuildingQueryListener.php';
    public const TOWN_HANDLER = 'src/Service/TownHandler.php';

    private readonly Parser $parser;
    private readonly NodeFinder $finder;

    /** @var list<string> */
    private array $ignores = [];

    public function __construct(private readonly string $cheminSource)
    {
        $this->parser = (new ParserFactory())->createForVersion(PhpVersion::fromComponents(8, 4));
        $this->finder = new NodeFinder();
    }

    /**
     * Effets par chantier : uid → nom de l'effet → valeurs par niveau, valeur par défaut et origine.
     *
     * @return array<string, array<string, array{valeurs: array<int, int|float>, defaut: int|float|null, source: string}>>
     */
    public function lire(): array
    {
        $this->ignores = [];
        $effets = [];

        $this->lireListenerEvolution($effets);
        $this->lireListenerValeurs($effets);
        $this->lireTownHandler($effets);

        ksort($effets);
        foreach ($effets as &$parEffet) {
            ksort($parEffet);
        }
        unset($parEffet);

        return $effets;
    }

    /**
     * Formes rencontrées mais non interprétées, à vérifier à la main après une mise à jour du jeu.
     *
     * @return list<string>
     */
    public function ignores(): array
    {
        return $this->ignores;
    }

    /** @param array<string, array<string, array<string, mixed>>> $effets */
    private function lireListenerEvolution(array &$effets): void
    {
        $fichier = self::LISTENER_EVOLUTION;

        foreach ($this->finder->findInstanceOf($this->analyser($fichier), Assign::class) as $affectation) {
            if (!$affectation->var instanceof PropertyFetch || !$affectation->var->name instanceof Identifier || !$affectation->expr instanceof Match_) {
                continue;
            }

            $effet = $affectation->var->name->toString();

            foreach ($affectation->expr->arms as $bras) {
                if ($bras->conds === null) {
                    continue;
                }

                $uid = self::chaineUnique($bras->conds);
                $tableau = self::tableauIndexeParNiveau($bras->body);

                if ($uid === null || $tableau === null) {
                    $this->ignores[] = "$fichier : bras de « $effet » non reconnu (ligne {$bras->getStartLine()})";

                    continue;
                }

                $effets[$uid][$effet] = [
                    'valeurs' => $tableau['valeurs'],
                    'defaut' => $tableau['defaut'],
                    'source' => 'BuildingUpgradeListener',
                ];
            }
        }
    }

    /** @param array<string, array<string, array<string, mixed>>> $effets */
    private function lireListenerValeurs(array &$effets): void
    {
        $fichier = self::LISTENER_VALEURS;

        foreach ($this->finder->findInstanceOf($this->analyser($fichier), MatchArm::class) as $bras) {
            $requete = self::requeteDeValeur($bras);
            if ($requete === null) {
                continue;
            }

            if (!$bras->body instanceof Match_) {
                continue;
            }

            $uid = $this->uidDuNiveau($bras->body->cond);
            if ($uid === null) {
                $this->ignores[] = "$fichier : « $requete » ne dépend pas du niveau d'un chantier (ligne {$bras->getStartLine()})";

                continue;
            }

            $effets[$uid][$requete] = $this->tableParNiveau($bras->body, "$fichier : « $requete »") + ['source' => 'BuildingQueryListener'];
        }
    }

    /** @param array<string, array<string, array<string, mixed>>> $effets */
    private function lireTownHandler(array &$effets): void
    {
        $fichier = self::TOWN_HANDLER;

        foreach ($this->finder->findInstanceOf($this->analyser($fichier), ClassMethod::class) as $methode) {
            $branches = array_merge(
                $this->finder->findInstanceOf($methode->stmts ?? [], If_::class),
                $this->finder->findInstanceOf($methode->stmts ?? [], ElseIf_::class)
            );

            foreach ($branches as $branche) {
                $uid = self::uidCompare($branche->cond);
                if ($uid === null) {
                    continue;
                }

                // Seules les affectations directes de la branche : un `if` imbriqué a sa propre condition.
                foreach ($branche->stmts as $instruction) {
                    if (!$instruction instanceof Node\Stmt\Expression || !$instruction->expr instanceof Assign) {
                        continue;
                    }

                    $affectation = $instruction->expr;
                    if (!$affectation->var instanceof Variable || !is_string($affectation->var->name) || !$affectation->expr instanceof Match_) {
                        continue;
                    }

                    if (!self::contientAppel($affectation->expr->cond, 'getLevel')) {
                        continue;
                    }

                    $effet = $methode->name->toString() . '.' . $affectation->var->name;
                    $effets[$uid][$effet] = $this->tableParNiveau($affectation->expr, "$fichier : « $effet »") + ['source' => 'TownHandler'];
                }
            }
        }
    }

    /** @return list<Node\Stmt> */
    private function analyser(string $relatif): array
    {
        $chemin = $this->cheminSource . '/' . $relatif;
        if (!is_file($chemin)) {
            throw new RuntimeException("Fichier source introuvable : $relatif (structure de MyHordes modifiée ?)");
        }

        $code = file_get_contents($chemin);
        if ($code === false) {
            throw new RuntimeException("Fichier source illisible : $relatif");
        }

        return $this->parser->parse($code) ?? [];
    }

    /**
     * Valeurs d'un `match` sur le niveau : bras à niveaux entiers (`0 => v`, `2, 3 => v`) et bras par défaut.
     *
     * @return array{valeurs: array<int, int|float>, defaut: int|float|null}
     */
    private function tableParNiveau(Match_ $match, string $contexte): array
    {
        $valeurs = [];
        $defaut = null;

        foreach ($match->arms as $bras) {
            $valeur = self::nombre($bras->body);

            if ($bras->conds === null) {
                $defaut = $valeur;
                if ($valeur === null) {
                    $this->ignores[] = "$contexte : valeur par défaut calculée, non reprise (ligne {$bras->getStartLine()})";
                }

                continue;
            }

            if ($valeur === null) {
                $this->ignores[] = "$contexte : valeur calculée, non reprise (ligne {$bras->getStartLine()})";

                continue;
            }

            foreach ($bras->conds as $condition) {
                $niveau = self::nombre($condition);
                if (!is_int($niveau)) {
                    $this->ignores[] = "$contexte : condition qui n'est pas un niveau (ligne {$bras->getStartLine()})";

                    continue;
                }

                $valeurs[$niveau] = $valeur;
            }
        }

        ksort($valeurs);

        return ['valeurs' => $valeurs, 'defaut' => $defaut];
    }

    /** Nom de la requête `BuildingValueQuery::Y` d'un bras, nul pour un autre bras. */
    private static function requeteDeValeur(MatchArm $bras): ?string
    {
        if ($bras->conds === null || count($bras->conds) !== 1) {
            return null;
        }

        $condition = $bras->conds[0];
        if (!$condition instanceof ClassConstFetch || !$condition->class instanceof Node\Name || !$condition->name instanceof Identifier) {
            return null;
        }

        return $condition->class->getLast() === 'BuildingValueQuery' ? $condition->name->toString() : null;
    }

    /** Uid du chantier dont le niveau est lu dans une expression (`getBuilding(…, 'uid', …)?->getLevel()`), nul sinon. */
    private function uidDuNiveau(Expr $expression): ?string
    {
        if (!self::contientAppel($expression, 'getLevel')) {
            return null;
        }

        foreach ($this->finder->find([$expression], static fn(Node $noeud): bool => self::estAppel($noeud, 'getBuilding')) as $appel) {
            /** @var MethodCall|NullsafeMethodCall $appel */
            foreach ($appel->args as $argument) {
                if ($argument instanceof Arg && $argument->value instanceof String_) {
                    return $argument->value->value;
                }
            }
        }

        return null;
    }

    /** Uid comparé à `…getName()` dans une condition `===`, nul sinon. */
    private static function uidCompare(Expr $condition): ?string
    {
        if (!$condition instanceof Identical) {
            return null;
        }

        foreach ([[$condition->left, $condition->right], [$condition->right, $condition->left]] as [$appel, $valeur]) {
            if (self::estAppel($appel, 'getName') && $valeur instanceof String_) {
                return $valeur->value;
            }
        }

        return null;
    }

    private static function contientAppel(Expr $expression, string $methode): bool
    {
        return (new NodeFinder())->findFirst([$expression], static fn(Node $noeud): bool => self::estAppel($noeud, $methode)) !== null;
    }

    private static function estAppel(Node $noeud, string $methode): bool
    {
        return ($noeud instanceof MethodCall || $noeud instanceof NullsafeMethodCall)
            && $noeud->name instanceof Identifier
            && $noeud->name->toString() === $methode;
    }

    /**
     * Uid d'un bras à condition unique `'uid'`.
     *
     * @param list<Expr> $conditions
     */
    private static function chaineUnique(array $conditions): ?string
    {
        return count($conditions) === 1 && $conditions[0] instanceof String_ ? $conditions[0]->value : null;
    }

    /**
     * Forme `[v0, v1, …][niveau] ?? défaut`.
     *
     * @return array{valeurs: array<int, int|float>, defaut: int|float|null}|null
     */
    private static function tableauIndexeParNiveau(Expr $corps): ?array
    {
        if (!$corps instanceof Coalesce || !$corps->left instanceof ArrayDimFetch || !$corps->left->var instanceof Expr\Array_) {
            return null;
        }

        $valeurs = [];
        foreach ($corps->left->var->items as $index => $element) {
            $valeur = $element === null ? null : self::nombre($element->value);
            if ($valeur === null || $element->key !== null) {
                return null;
            }

            $valeurs[$index] = $valeur;
        }

        return ['valeurs' => $valeurs, 'defaut' => self::nombre($corps->right)];
    }

    /** Valeur d'un littéral numérique (signe compris), nulle pour toute autre expression. */
    private static function nombre(Expr $expression): int|float|null
    {
        if ($expression instanceof Int_ || $expression instanceof Float_) {
            return $expression->value;
        }

        if ($expression instanceof UnaryMinus) {
            $valeur = self::nombre($expression->expr);

            return $valeur === null ? null : -$valeur;
        }

        return null;
    }
}
