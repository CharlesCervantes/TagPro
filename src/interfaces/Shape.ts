/* eslint-disable @typescript-eslint/no-explicit-any */

// TODO: mejorar la logica de los puntos por tipo de figura, quedara de manera default la logica del rectangulo

export interface IShape {
    label: string,
    points: [number, number][]
    group_id: string | null
    description: string
    shape_type: string
    flags: any
    mask: string | null
}