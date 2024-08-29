/* eslint-disable @typescript-eslint/no-unused-vars */
import styles from './Topbar.module.scss'
import logo from '../../../public/logo03.png'
import { Button } from '@mantine/core'
import { useAppState } from '../../store/app.store'
import { useState } from 'react'
import jszip from 'jszip'
import ModalComponent from '../Modals/Modal'
import { IJson } from '../../interfaces/Json'
import { IShape } from '../../interfaces/Shape'
import { getImageDimensions } from '../../tools/Image'
import {saveAs} from 'file-saver'
import toast from 'react-hot-toast'

export function TopBar (): React.ReactNode {
  const { Files, Jsons, imageFigures } = useAppState()

  const [noLabel, setNoLabel] = useState<File[]>([])
  const [opened, setOpnend] = useState<boolean>(false)

  const handleClick = async () => {
    if (Files.length === 0) {
      toast.error("Please upload your Files");
      return;
    }
    const emptyRectangles: File[] = [];

    const currentFiles = Files;
    const currentJsons = Jsons;
    const currentImageFigures = imageFigures;

    const targetJsons: IJson[] = [];

    for (let i = 0; i < currentFiles.length; i++) {
      const element = currentFiles[i];
      const json = currentJsons.find(j => j.imagePath === element.name);
      const figures = currentImageFigures.find(ir => ir.imageName === element.name);

      const { height: imageHeight, width: imageWidth } = await getImageDimensions(element!);

      const shapes: IShape[] = [];

      if (figures?.shapes && figures?.shapes.length > 0) {
        for (let j = 0; j < figures.shapes.length; j++) {
          const shape = figures.shapes[j];

          if (shape.shape_type === 'rectangle') {
            const tlX = Math.max(0, Math.min(shape.object.aCoords?.tl.x ?? 0, imageWidth));
            const tlY = Math.max(0, Math.min(shape.object.aCoords?.tl.y ?? 0, imageHeight));
            const brX = Math.max(0, Math.min(shape.object.aCoords?.br.x ?? 0, imageWidth));
            const brY = Math.max(0, Math.min(shape.object.aCoords?.br.y ?? 0, imageHeight));

            const newShape: IShape = {
              label: shape.className,
              points: [
                [tlX, tlY],
                [brX, brY]
              ],
              group_id: null,
              description: '',
              shape_type: 'rectangle',
              flags: {},
              mask: null
            };

            shapes.push(newShape);
          } else if (shape.shape_type === 'polygon') {
            const points: [number, number][] = shape.points.map(point => [
              Math.max(0, Math.min(point.x, imageWidth)),
              Math.max(0, Math.min(point.y, imageHeight))
            ]) as [number, number][];

            const newShape: IShape = {
              label: shape.className,
              points: points,
              group_id: null,
              description: '',
              shape_type: 'polygon',
              flags: {},
              mask: null
            };

            shapes.push(newShape);
          } else if (shape.shape_type === 'circle') {
            const centerX = Math.max(0, Math.min(shape.center.x, imageWidth));
            const centerY = Math.max(0, Math.min(shape.center.y, imageHeight));
            const radius = Math.min(shape.radius, Math.min(imageWidth, imageHeight) / 2);

            const newShape: IShape = {
              label: shape.className,
              points: [
                [centerX, centerY],
                [centerX + radius, centerY]  // Guardar el centro y un punto en el borde
              ],
              group_id: null,
              description: '',
              shape_type: 'circle',
              flags: {},
              mask: null
            };

            shapes.push(newShape);
          }
        }

        if (json) {
          json.shapes = shapes;
          targetJsons.push(json);
        }
      } else {
        emptyRectangles.push(element);
      }
    }

    if (emptyRectangles.length > 0) {
      setNoLabel(emptyRectangles);
      setOpnend(true);
    } else {
      const zip = new jszip();

      targetJsons.forEach(json => {
        const imagePath = json.imagePath;
        const jsonFileName = imagePath.replace(/\.[^/.]+$/, "") + ".json";
        zip.file(jsonFileName, JSON.stringify(json, null, 2));
      });

      const filePromises = currentFiles.map(file => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = function (e) {
            if (e.target?.result) {
              const arrayBuffer = e.target.result;
              zip.file(file.name, arrayBuffer);
              resolve();
            } else {
              reject(new Error("Error reading file"));
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      });

      await Promise.all(filePromises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "labels.zip");
    }
  };


  const handleWithoutNoTaggs = async () => {
    const targetJsons: IJson[] = [];

    const currentFiles = Files;
    const currentJsons = Jsons;
    const currentImageRectangles = imageFigures;

    const files_with_annotations: string[] = [];

    for (let i = 0; i < currentImageRectangles.length; i++) {
      const shapes_of_image = currentImageRectangles[i];
      if (shapes_of_image.shapes.length > 0) {
        files_with_annotations.push(shapes_of_image.imageName);
      }
    }

    for (let i = 0; i < files_with_annotations.length; i++) {
      const file_name = files_with_annotations[i];
      const file = currentFiles.find(f => f.name === file_name);
      const json = currentJsons.find(js => js.imagePath === file_name);
      const rectangles = currentImageRectangles.find(imgs => imgs.imageName === file_name);

      const { height: imageHeight, width: imageWidth } = await getImageDimensions(file!);

      const shapes: IShape[] = [];

      if (rectangles !== undefined) {
        for (let j = 0; j < rectangles.shapes.length; j++) {
          const shape = rectangles.shapes[j];

          if (shape.shape_type === 'rectangle') {
            const tlX = Math.max(0, Math.min(shape.object.aCoords?.tl.x ?? 0, imageWidth));
            const tlY = Math.max(0, Math.min(shape.object.aCoords?.tl.y ?? 0, imageHeight));
            const brX = Math.max(0, Math.min(shape.object.aCoords?.br.x ?? 0, imageWidth));
            const brY = Math.max(0, Math.min(shape.object.aCoords?.br.y ?? 0, imageHeight));

            const newShape: IShape = {
              label: shape.className,
              points: [
                [tlX, tlY],
                [brX, brY]
              ],
              group_id: null,
              description: '',
              shape_type: 'rectangle',
              flags: {},
              mask: null
            };

            shapes.push(newShape);
          } else if (shape.shape_type === 'polygon') {
            const points: [number, number][] = shape.points.map(point => [
              Math.max(0, Math.min(point.x, imageWidth)),
              Math.max(0, Math.min(point.y, imageHeight))
            ]);

            const newShape: IShape = {
              label: shape.className,
              points: points,
              group_id: null,
              description: '',
              shape_type: 'polygon',
              flags: {},
              mask: null
            };

            shapes.push(newShape);
          } else if (shape.shape_type === 'circle') {
            const centerX = Math.max(0, Math.min(shape.center.x, imageWidth));
            const centerY = Math.max(0, Math.min(shape.center.y, imageHeight));
            const radius = Math.min(shape.radius, Math.min(imageWidth, imageHeight) / 2);

            const newShape: IShape = {
              label: shape.className,
              points: [
                [centerX, centerY],
                [centerX + radius, centerY]  // Guardar el centro y un punto en el borde
              ],
              group_id: null,
              description: '',
              shape_type: 'circle',
              flags: {},
              mask: null
            };

            shapes.push(newShape);
          }
        }
      }

      if (json !== undefined) {
        json.shapes = shapes;
        targetJsons.push(json);
      }
    }

    const zip = new jszip();

    targetJsons.forEach(json => {
      const imagePath = json.imagePath;
      const jsonFileName = imagePath.replace(/\.[^/.]+$/, "") + ".json";
      zip.file(jsonFileName, JSON.stringify(json, null, 2));
    });

    const filteredFiles = currentFiles.filter(file => files_with_annotations.includes(file.name));

    const filePromises = filteredFiles.map(file => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          if (e.target?.result) {
            const arrayBuffer = e.target.result as ArrayBuffer;
            zip.file(file.name, arrayBuffer);
            resolve();
          } else {
            reject(new Error("Error reading file"));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });

    await Promise.all(filePromises);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "labels.zip");
  };

  const handleCloseModal = () => {
    setOpnend(false)
  }

  const render_images_without_labels = (
    <>
      <h1>Imagenes sin tags</h1>
      {noLabel.map(l => (
        <div key={l.name}>{l.name}</div>
      ))}
      <div>
        <Button onClick={handleCloseModal}>Seguir editando</Button>
        <Button onClick={handleWithoutNoTaggs}>Descartar imagenes</Button>
      </div>
    </>
  )

  return (
    <>
      <div className={styles.topBarr}>
      <div>
        <img src={logo} className={styles.logo} />
        <p className={styles.logo_desc}> Annotation tool S3 </p>
      </div>
      <div>
      </div>
      <div>
          <Button variant='gradient' gradient={{ from: 'teal', to: 'blue', deg: 60 }} onClick={handleClick}>Download labels</Button>
      </div>
    </div>

    <ModalComponent children={render_images_without_labels} close={handleCloseModal} opened={opened} />
    </>
  )
}
