/** lib.dom.d.ts type les flags WebGPU en `number` nu mais n'expose pas les objets de constantes globaux. */
declare const GPUBufferUsage: {
    readonly MAP_READ: number;
    readonly MAP_WRITE: number;
    readonly COPY_SRC: number;
    readonly COPY_DST: number;
    readonly INDEX: number;
    readonly VERTEX: number;
    readonly UNIFORM: number;
    readonly STORAGE: number;
    readonly INDIRECT: number;
    readonly QUERY_RESOLVE: number;
};

declare const GPUMapMode: {
    readonly READ: number;
    readonly WRITE: number;
};
