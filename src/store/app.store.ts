/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand'
import { fabric } from 'fabric'
import { IJson } from '../interfaces/Json'


// TODO: ver si es necesario adjuntar los datos en un objeto para poder facilitar el renderizado

export interface Shape {
  id: string;
  className: string;
  object: fabric.Object;
  shape_type: string;
  points?: { x: number, y: number }[];  // Para polígonos
  radius?: number;  // Para círculos
  center?: { x: number, y: number };  // Para círculos
}


export interface ImageFigures {
  imageIndex: number
  shapes: Shape[]
  imageName: string
  imageProps? : fabric.Image
}

interface AppStore {
  imageFigures: ImageFigures[]
  resetState: () => void

// IMAGENES
  Files: File[]
  Jsons: IJson[]
  imageIndex: number | undefined
  addImages: (images: File[]) => void
  setImageIndex: (index: number) => void
  removeImage: (index: number) => void;
  removeAllImages: () => void
  setImageProps: (imageIndex: number, imageProps: fabric.Image) => void

// SHAPES
  addShape: (shape: Shape, imageIndex: number) => void
  removeShape: (id: string, imageIndex: number) => void;

// CLASES
  classes: string[]
  currentClass: string
  addClass: (classname: string) => void
  removeClass: (classname: string) => void
  setCurrentClass: (classname: string) => void
}

export const useAppState = create<AppStore>()(set => ({
  resetState: () => set({
    Files: [],
    imageIndex: undefined,
    Jsons: [],
    imageFigures: [],
    classes: [],
    currentClass: '',
  }),

  Jsons: [],

  imageFigures: [],
  
  // IMAGENES ------------------------------------------------ //
  Files: [],
  imageIndex: 0,
  addImages: (images: File[]) => {
    const jsons: IJson[] = []
    let imagesProcessed = 0

    images.forEach((image, _index) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string
        const base64Data = imageDataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '') // Remove the prefix
        const imgElement = new Image()

        imgElement.onload = () => {
          const newJson: IJson = {
            version: '',
            flags: {},
            shapes: [],
            imagePath: image.name,
            imageData: base64Data,
            imageHeight: imgElement.height,
            imageWidth: imgElement.width
          }

          jsons.push(newJson)
          imagesProcessed++

          // Verifica si todas las imágenes han sido procesadas
          if (imagesProcessed === images.length) {
            set((state) => ({
              Files: [...state.Files, ...images],
              Jsons: [...state.Jsons, ...jsons],
              imageFigures: [
                ...state.imageFigures,
                ...images.map((img, idx) => ({
                  imageIndex: state.Files.length + idx,
                  shapes: [],
                  imageName: img.name,
                  imageProps: undefined
                }))
              ]
            }))
          }
        }

        imgElement.src = imageDataUrl
      }
      reader.readAsDataURL(image)
    })
  },
  setImageIndex: (index: number) => {
    set((state) => {
      // Verificar que el índice esté dentro del rango válido
      if (index >= 0 && index < state.Files.length) {
        return { ...state, imageIndex: index };
      }
      return state; // No se realizan cambios si el índice está fuera de rango
    });
  },
  removeImage: (index: number) => {
    set((state) => {
      if (index >= 0 && index < state.Files.length) {
        const newFiles = [...state.Files]
        const imageSelected = newFiles[index]

        newFiles.splice(index, 1) // Eliminar la imagen en el índice dado

        const newJsons = state.Jsons.filter(json => json.imagePath !== imageSelected.name) // Filtrar el JSON correspondiente
        const newImageIndex = state.imageIndex === index ? undefined : state.imageIndex // Si la imagen eliminada es la imagen activa, establecer imageIndex a undefined

        let newImageFigures = state.imageFigures.filter(img => img.imageIndex !== index)

        // Actualizar los índices de imageRectangles
        newImageFigures = newImageFigures.map((img) => {
          if (img.imageIndex > index) {
            return { ...img, imageIndex: img.imageIndex - 1 };
          }
          return img;
        });

        return {
          ...state,
          Files: newFiles,
          Jsons: newJsons,
          imageIndex: newImageIndex,
          imageFigures: newImageFigures
        }
      }
      return state
    })
  },
  removeAllImages: () => {
    set({
      Files: [],
      Jsons: [],
      imageIndex: undefined,
      imageFigures: []
    });
  },
  setImageProps: (imageIndex: number, imageObject: fabric.Image) =>
    set((state) => {
      const updatedImageFigures = [...state.imageFigures];
      const imageFig = updatedImageFigures.find(ir => ir.imageIndex === imageIndex);
      if (imageFig) {
        const canvasContainer = document.querySelector('.canva') as HTMLElement;
        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;
        const scaleFactor = Math.min(containerWidth / imageObject.width!, containerHeight / imageObject.height!);

        imageFig.imageProps = imageObject;
        imageFig.scaleX = scaleFactor;
        imageFig.scaleY = scaleFactor;
      }
      return { imageFigures: updatedImageFigures };
    }),

  
  
  // SHAPES -------------------------------------------- //
  addShape: (shape: Shape, imageIndex: number) =>
    set((state) => {
      const updatedImageShapes = [...state.imageFigures];
      const imageShapes = updatedImageShapes.find((img) => img.imageIndex === imageIndex);

      if (imageShapes) {
        const { scaleX, scaleY } = imageShapes;

        if (shape.object.type === 'rect' || shape.object.type === 'polygon' || shape.object.type === 'circle') {
          shape.object.set({
            left: shape.object.left! / scaleX!,
            top: shape.object.top! / scaleY!,
            scaleX: shape.object.scaleX! / scaleX!,
            scaleY: shape.object.scaleY! / scaleY!,
          });

          if (shape.object.type === 'polygon') {
            const points = shape.points.map(point => ({
              x: point.x / scaleX!,
              y: point.y / scaleY!,
            }));
            shape.object.set({ points });
          }

          if (shape.object.type === 'circle') {
            shape.object.set({
              radius: shape.object.radius! / scaleX!
            });
          }
        }

        imageShapes.shapes.push(shape);
      } else {
        updatedImageShapes.push({ imageIndex, shapes: [shape], imageName: '', imageProps: undefined });
      }

      return { imageFigures: updatedImageShapes };
    }),
  removeShape: (id: string, imageIndex: number) =>
    set((state) => {
      const updatedImageShapes = state.imageFigures.map((img) => {
        if (img.imageIndex === imageIndex) {
          return {
            ...img,
            shapes: img.shapes.filter((shape) => shape.id !== id)
          };
        }
        return img;
      });

      return { imageFigures: updatedImageShapes };
    }),


  // CLASES ------------------------------------------------- //
  classes: [],
  currentClass: '',
  addClass: (className: string) => {
    set((state) => ({
      ...state,
      classes: [...state.classes, className]
    }))
  },
  removeClass: (className: string) => {
    set((state) => {
      // Filtrar y eliminar los rectángulos asociados a la clase
      const updatedImageRectangles = state.imageFigures.map((imageRect) => ({
        ...imageRect,
        shapes: imageRect.shapes.filter(rect => rect.className !== className),
      }));

      return {
        ...state,
        classes: state.classes.filter(c => c !== className),
        imageFigures: updatedImageRectangles,
      };
    });
  },
  setCurrentClass: (className: string) => set({currentClass: className}),

// ------------------
  })
)



function get() {
  throw new Error('Function not implemented.')
}
// Store con persistencia de datos

// export const useAppState = create<AppStore>()(
//   devtools(
//     persist(
//       (set) => ({
//         resetState: () => set({ Files: [], imageIndex: undefined, Jsons: [] }),
//         Jsons: [],

//         // IMAGENES ------------------
//         Files: [],
//         imageIndex: undefined,
//         // addImages: (images) => set((state) => ({ Files: [...state.Files, ...images] })),
//         addImages: (images: File[]) => {
//           const jsons: IJson[] = []
//           let imagesProcessed = 0

//           images.forEach((image) => {
//             const reader = new FileReader()

//             reader.onload = (e) => {
//               const imageDataUrl = e.target?.result as string
//               const base64Data = imageDataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '') // Remove the prefix
//               const imgElement = new Image()

//               imgElement.onload = () => {
//                 const newJson: IJson = {
//                   version: '',
//                   flags: {},
//                   shapes: [],
//                   imagePath: image.name,
//                   imageData: base64Data,
//                   imageHeight: imgElement.height,
//                   imageWidth: imgElement.width
//                 }

//                 jsons.push(newJson)
//                 imagesProcessed++

//                 // Verifica si todas las imágenes han sido procesadas
//                 if (imagesProcessed === images.length) {
//                   set((state) => ({
//                     Files: [...state.Files, ...images],
//                     Jsons: [...state.Jsons, ...jsons]
//                   }))
//                 }
//               }

//               imgElement.src = imageDataUrl
//             }

//             reader.readAsDataURL(image)
//           })
//         },
//         setImageIndex: (index: number) => {
//           set((state) => {
//             // Verificar que el índice esté dentro del rango válido
//             if (index >= 0 && index < state.Files.length) {
//               return { ...state, imageIndex: index };
//             }
//             return state; // No se realizan cambios si el índice está fuera de rango
//           });
//         },
//         removeImage: (index: number) => {
//           set((state) => {
//             if (index >= 0 && index < state.Files.length) {
//               const newFiles = [...state.Files]
//               const imageSelected = newFiles[index]

//               newFiles.splice(index, 1) // Eliminar la imagen en el índice dado

//               const newJsons = state.Jsons.filter(json => json.imagePath !== imageSelected.name) // Filtrar el JSON correspondiente

//               const newImageIndex = state.imageIndex === index ? undefined : state.imageIndex // Si la imagen eliminada es la imagen activa, establecer imageIndex a undefined

//               return {
//                 ...state,
//                 Files: newFiles,
//                 Jsons: newJsons,
//                 imageIndex: newImageIndex
//               }
//             }
//             return state
//           })
//         },


//         // RECTANGULOS --------------

//       }),
//       { name: 'labeltool' }
//     )
//   )
// )