/* eslint-disable @typescript-eslint/no-explicit-any */
import { IShape } from './Shape'

export interface IJson {
    version: string,
    flags: any,
    shapes: IShape[]
    imagePath: string
    imageData: string
    imageHeight: number
    imageWidth: number
}