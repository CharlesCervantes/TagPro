/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { IconSquareLetterR, IconSquareLetterF, IconSquareLetterD, IconLockAccess, IconLockOpen, IconXboxX, IconCirclePlus, IconArrowsMaximize } from '@tabler/icons-react'
import { IconPhotoUp, IconSquarePlus2, IconZoomIn, IconTrash, IconSquareLetterZ, IconPolygon } from '@tabler/icons-react'
import { FabricJSCanvas, type FabricJSEditor, useFabricJSEditor } from 'fabricjs-react'
import { ImageFigures, useAppState } from '../../store/app.store'
import { Center, Loader, Tooltip } from '@mantine/core'
import styles from './imageTag.module.scss'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fabric } from 'fabric';
import cuid from 'cuid';

export function ImageTag(): React.ReactNode {
  const { addImages, Files, imageIndex, imageFigures, addShape, setImageIndex, removeShape, setImageProps, currentClass } = useAppState();
  const [currentShape, setCurrentShape] = useState<'polygon' | 'rectangle' | 'circle'>('rectangle');
  const [rectangleToastId, setRectangleToastId] = useState<string | null>(null);
  const [polygonToastId, setPolygonToastId] = useState<string | null>(null);
  const [circleToastId, setCircleToastId] = useState<string | null>(null);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [zoomInactive, setZoomInactive] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropImage, setCropImage] = useState(true);
  const { editor, onReady } = useFabricJSEditor();
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState([]);
  const [zoom, setZoom] = useState(1);
  const initialZoom = 1


  // ********************************************FUNCIONES********************************************* //

  // Función para manejar cambios en el input de archivos
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;

    if (selectedFiles && selectedFiles.length > 0) {
      setLoading(true); // Activar el loader
      const files = Array.from(selectedFiles);
      const existingFileNames = useAppState.getState().Files.map(file => file.name);

      const newFiles = files.filter(file => {
        if (existingFileNames.includes(file.name)) {
          toast(`Image ${file.name} is already loaded`, {
            icon: <IconXboxX />,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            }
          });
          return false;
        }
        return true;
      });

      if (newFiles.length > 0) {
        addImages(newFiles);
        setCropImage(true);
        if (Files.length === 0) {
          setImageIndex(0); // Solo establece el índice si no hay imágenes previamente
        }
      } else {
        setLoading(false);
      }
    } else {
      toast(`Please upload images`, {
        icon: <IconXboxX />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    }
  };


  // Función para cargar y renderizar imágenes en el lienzo
  const loadAndRenderImage = (image: any, editor: FabricJSEditor | null) => {
    if (editor && image) {
      editor.canvas.selection = false;
      setLoading(true);
      editor.canvas?.clear();
      const renderImage = (fabricImage: fabric.Image) => {
        const originalWidth = fabricImage.width ?? 0;
        const originalHeight = fabricImage.height ?? 0;

        fabricImage.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
        });

        editor.canvas?.setBackgroundImage(fabricImage, editor.canvas?.renderAll.bind(editor.canvas));
        editor.canvas?.setDimensions({
          width: originalWidth,
          height: originalHeight,
        });

        if (imageIndex != undefined) {
          setImageProps(imageIndex, fabricImage); 
        }

        setLoading(false);
      };

      if (image instanceof File) {
        fabric.Image.fromURL(URL.createObjectURL(image), renderImage);
      } else if (typeof image === 'string') {
        fabric.Image.fromURL(image, renderImage);
      }
    }
  };


  // Renderizar imagen seleccionada como fondo del lienzo
  const renderSelectedImage = (editor: FabricJSEditor | null, imageIndex: number, Files: File[], imageFigures: ImageFigures[]) => {
    if (editor && Files.length > 0 && imageIndex >= 0 && imageIndex < Files.length) {
      setLoading(true);
      const selectedImage = Files[imageIndex];
      if (selectedImage instanceof File || selectedImage instanceof Blob) {
        const blobURL = URL.createObjectURL(selectedImage);
        fabric.Image.fromURL(blobURL, (fabricImage) => {
          editor.canvas?.clear();

          // Ajuste de escala y configuración inicial
          const canvasWidth = editor.canvas.getWidth();
          const canvasHeight = editor.canvas.getHeight();
          const scaleFactor = Math.min(canvasWidth / fabricImage.width, canvasHeight / fabricImage.height);
          fabricImage.scale(scaleFactor).set({
            selectable: false,
            evented: false,
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center'
          });

          // Establecer la imagen como fondo y ajustar las dimensiones del lienzo
          editor.canvas.setBackgroundImage(fabricImage, editor.canvas.renderAll.bind(editor.canvas));

          // Renderizar formas asociadas si existen
          const currentImageFigures = imageFigures.find(ir => ir.imageIndex === imageIndex);
          currentImageFigures?.shapes.forEach(shape => {
            editor.canvas.add(shape.object);
            editor.canvas.bringToFront(shape.object);
          });

          URL.revokeObjectURL(blobURL);
          setLoading(false);
        });
      }
    }
  };

  // Función para manejar el zoom
  const handleMouseWheel = (e: WheelEvent): void => {
    if (!e.ctrlKey || zoomInactive) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY;
    const zoomFactor = 0.1; // Ajusta este valor para cambiar la sensibilidad
    let newZoom = zoom + (delta > 0 ? -zoomFactor : zoomFactor);

    // Limitar el zoom out a un mínimo razonable
    const minZoom = 0.1; // Cambia esto según sea necesario
    const maxZoom = 10; // Cambia esto según sea necesario

    newZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);

    setZoom(newZoom);
  };

  // Función para mostrar la notificación al iniciar el dibujo
  const showDrawingToast = (shapeType: string) => {
    let icon;
    switch (shapeType) {
      case 'polygon':
        icon = <IconPolygon />;
        break;
      case 'rectangle':
        icon = <IconSquarePlus2 />;
        break;
      case 'circle':
        icon = <IconCirclePlus />;
        break;
      default:
        icon = <IconSquarePlus2 />;
    }

    return toast.loading(`Drawing ${shapeType} `, {
      position: 'top-right',
      icon: icon,
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      }
    });
  };

  // Función para cerrar la notificación al completar el dibujo
  const closeDrawingToast = (toastId: string) => {
    toast.dismiss(toastId);
  };

  // Clic para rectangulo
  const handleAddRectangleButtonClick = () => {
    if (Files.length > 0) {
      if (!currentClass) {
        toast(`Please select a class`, {
          icon: <IconXboxX />,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        });
        return;
      }
      setCurrentShape('rectangle');
      setZoomInactive(true);
      setIsDrawing(true); // Iniciar el dibujo directamente

      // Mostrar la notificación de dibujo
      const toastId = showDrawingToast('rectangle');
      setRectangleToastId(toastId); // Guardar el ID del toast para cerrarlo después
    } else {
      toast(`Please upload images`, {
        icon: <IconXboxX />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    }
  };

 // Clic para polygons
  const handleAddPolygonButtonClick = () => {
    if (Files.length > 0) {
      setCurrentShape('polygon')
      setZoomInactive(true)
      startDrawingPolygon()
    } else {
      toast(`Please upload images`, {
        icon: <IconXboxX />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      })
    }
  }

  // Clic para Circulos
  const handleAddCircleButtonClick = () => {
    if (Files.length > 0) {
      if (!currentClass) {
        toast(`Please select a class`, {
          icon: <IconXboxX />,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        });
        return;
      }
      setCurrentShape('circle');
      setZoomInactive(true);
      setIsDrawing(true); // Iniciar el dibujo directamente

      // Mostrar la notificación de dibujo
      const toastId = showDrawingToast('circle');
      setCircleToastId(toastId); // Guardar el ID del toast para cerrarlo después
    } else {
      toast(`Please upload images`, {
        icon: <IconXboxX />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    }
  };


  // Eliminar Rectangulo
  const handleDeleteShape = () => {
    const canvas = editor?.canvas;
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.id) {
        // Remove from the store
        removeShape(activeObject.id, imageIndex ?? 0);

        // Remove from the canvas
        canvas.remove(activeObject);
        canvas.discardActiveObject().renderAll(); // Make sure to re-render the canvas to reflect changes

        toast(`Shape deleted`, {
          icon: <IconXboxX color='red' />,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        })
      } else {
        console.log('Failed to remove shape: No active object or object ID not found');
      }
    }
  };

  // Función para bloquear/desbloquear el rectángulo seleccionado
  const toggleLockRectangle = () => {
    const canvas = editor?.canvas;
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        const isLocked = activeObject.lockMovementX;  // Verificar el estado actual de bloqueo/desbloqueo

        // Invertir el estado de bloqueo y ajustar las propiedades
        activeObject.set({
          lockMovementX: !isLocked,
          lockMovementY: !isLocked,
          lockScalingX: !isLocked,
          lockScalingY: !isLocked,
          lockRotation: !isLocked,
          hasControls: isLocked,  // Mostrar controles si estaba bloqueado (ahora desbloqueado)
        });

        // Aplicar estilos específicos dependiendo del tipo de objeto y del estado
        if (activeObject.type === 'group') {
          // Aplicar estilos para cada objeto en el grupo
          activeObject.forEachObject((obj) => {
            obj.set({
              fill: isLocked ? '#ff000042' : '#a49f9f7a',  // Colores correctos para desbloqueado/bloqueado
              stroke: isLocked ? '#ff0000' : '#0000007b',
            });
          });
        } else if (activeObject.type === 'polygon') {
          // Aplicar estilos directamente al polígono
          activeObject.set({
            fill: isLocked ? '#ff000042' : '#a49f9f7a',  // Colores correctos para desbloqueado/bloqueado
            stroke: isLocked ? '#ff0000' : '#0000007b',
          });
        }

        // Notificaciones de cambio de estado
        if (isLocked) {  // Si estaba bloqueado y ahora se desbloquea
          toast('Unblock', {
            icon: <IconLockOpen />,
            style: {
              borderRadius: '10px',
              background: '#fff',
              color: '#333',
            }
          });
        } else {  // Si estaba desbloqueado y ahora se bloquea
          toast('Block', {
            icon: <IconLockAccess />,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            }
          });
        }

        canvas.requestRenderAll(); // Actualizar el canvas para mostrar los cambios
      } else {
        toast('No object selected', {
          icon: <IconXboxX />,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        });
      }
    }
  };

  // Inicia el dibujo del polígono
  const startDrawingPolygon = () => {
    if (!currentClass) {
      toast(`Please select a class`, {
        icon: <IconXboxX />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
      return;
    }
    setIsDrawingPolygon(true);
    setZoomInactive(false);
    setPoints([]);
    const toastId = showDrawingToast('polygon');
    setPolygonToastId(toastId); // Guardar el ID del toast para cerrarlo después
  };

  // Puntos para crear el poligono
  const addPolygonPoint = (options) => {
    if (!isDrawingPolygon) return;

    const pointer = editor.canvas.getPointer(options.e);
    const newPoint = { x: pointer.x, y: pointer.y };
    const newPoints = [...points, newPoint];
    setPoints(newPoints);

    const newCircle = new fabric.Circle({
      radius: 3,
      fill: points.length === 0 ? '#00ff00' : '#ff0000',
      left: newPoint.x,
      top: newPoint.y,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    editor.canvas.add(newCircle);

    if (newPoints.length > 1) {
      const lastPoint = newPoints[newPoints.length - 2];
      const newLine = new fabric.Line([lastPoint.x, lastPoint.y, newPoint.x, newPoint.y], {
        fill: '#ff0000',
        stroke: '#ff0000',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      editor.canvas.add(newLine);
    }

    if (newPoints.length > 2 && isNearStart(newPoints, pointer)) {
      completePolygon(newPoints);
    }
  };


  // Radio para cerrar el poligono
  const isNearStart = (points, pointer) => {
    if (points.length < 3) return false;
    const start = points[0];
    const px = pointer.x;
    const py = pointer.y;
    const distance = Math.sqrt((px - start.x) ** 2 + (py - start.y) ** 2);
    return distance < 10; // Radio de detección
  };

  // Función para calcular el centroide de un conjunto de puntos
  function calculateCentroid(pts) {
    const first = pts[0], last = pts[pts.length - 1];
    if (first.x != last.x || first.y != last.y) pts.push(first);
    let twicearea = 0,
      x = 0, y = 0,
      nPts = pts.length,
      p1, p2, f;
    for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
      p1 = pts[i]; p2 = pts[j];
      f = p1.x * p2.y - p2.x * p1.y;
      twicearea += f;
      x += (p1.x + p2.x) * f;
      y += (p1.y + p2.y) * f;
    }
    f = twicearea * 3;
    return { x: x / f, y: y / f };
  }

  // Completa el polígono cuando el usuario hace clic cerca del punto inicial
  const completePolygon = (points) => {
    setIsDrawingPolygon(false);
    setZoomInactive(true);
    if (polygonToastId) {
      closeDrawingToast(polygonToastId);
      setPolygonToastId(null);
    }

    const polygon = new fabric.Polygon(points, {
      stroke: '#333',
      strokeWidth: 1,
      fill: '#ff000042',
      selectable: true,
      evented: true,
      id: cuid()
    });

    const centroid = calculateCentroid(points);

    const label = new fabric.Text(currentClass, {
      fontSize: 14,
      fontFamily: 'Segoe UI',
      fill: '#000',
      backgroundColor: '#ffffff90',
      left: centroid.x,
      top: centroid.y,
      originX: 'center',
      originY: 'center'
    });

    const group = new fabric.Group([polygon, label], {
      id: cuid()
    });

    group.addWithUpdate();

    editor.canvas.forEachObject((obj) => {
      if (obj.type === 'circle' || obj.type === 'line') {
        editor.canvas.remove(obj);
      }
    });

    editor.canvas.add(group);
    editor.canvas.setActiveObject(group);
    editor.canvas.requestRenderAll();

    addShape({
      id: group.id,
      className: currentClass,
      shape_type: 'polygon',
      points: points,  // Asegúrate de guardar todos los puntos
      object: group
    }, imageIndex ?? 0);

    toast(`Polygon created`, {
      icon: <IconPolygon />,
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      }
    });

    setPoints([]);
  };

  // remover el ultimo punto de polygon 
  const removeLastPoint = () => {
    if (points.length > 0) {
      // Actualizar el array de puntos, eliminando el último
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);

      // Obtener todos los objetos del canvas
      const allObjects = editor.canvas.getObjects();

      // Filtrar solo los círculos y líneas temporales que pertenecen al polígono actual
      const tempCircles = allObjects.filter(obj => obj.type === 'circle' && !obj.evented);
      const tempLines = allObjects.filter(obj => obj.type === 'line' && !obj.evented);

      // Eliminar el último círculo y línea añadidos al canvas, que corresponden al último punto
      if (tempCircles.length > 0) {
        const lastCircle = tempCircles[tempCircles.length - 1]; // Obtener el último círculo
        editor.canvas.remove(lastCircle);
      }
      if (tempLines.length > 0) {
        const lastLine = tempLines[tempLines.length - 1]; // Obtener la última línea
        editor.canvas.remove(lastLine);
      }

      // No es necesario actualizar un polígono porque solo estamos eliminando puntos antes de que se cree el polígono
      editor.canvas.renderAll();
    }
  };

  const handleFitImage = () => {
    if (editor && Files.length > 0) {
      const minZoom = 0.4; // Este es el valor mínimo de zoom definido en tu función de manejo de zoom
      setZoom(minZoom);
      const canvas = editor.canvas;
      const backgroundImage = canvas.backgroundImage;
      if (backgroundImage) {
        const imageWidth = backgroundImage.width || 1; // Asegurar que no sea 0
        const imageHeight = backgroundImage.height || 1; // Asegurar que no sea 0

        // Aplicar el zoom mínimo posible y centrar la imagen en el canvas
        canvas.setZoom(minZoom);
        canvas.viewportTransform = [minZoom, 0, 0, minZoom, 0, 0];
        canvas.renderAll();
      }
    } else {
      toast(`Please upload images`, {
        icon: <IconXboxX />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    }
  };



  // ************************************************USE EFFECTS************************************************** //

  // Cargar y renderizar las imágenes cuando se actualice el estado de Files
  useEffect(() => {
    if (editor && Files.length > 0) {
      const selectedImage = Files[imageIndex];
      loadAndRenderImage(selectedImage, editor);

    }
  }, [imageIndex, Files, editor]);

  // Eliminacion de imagen si ya no hay imagenes
  useEffect(() => {
    if (editor && Files.length === 0) {
      editor.canvas?.clear();
    }
  }, [Files, editor]);

  // Zoom
  useEffect(() => {
    const canvaDiv = document.querySelector('.canva') as HTMLElement;
    if (canvaDiv) {
      canvaDiv.addEventListener('wheel', handleMouseWheel);
      canvaDiv.style.transform = `scale(${zoom})`;
      canvaDiv.style.transformOrigin = 'top left'; // Cambiado a 'top left'
    }
    return () => {
      if (canvaDiv) {
        canvaDiv.removeEventListener('wheel', handleMouseWheel);
      }
    };
  }, [zoom, zoomInactive]);

  //Zoom
  useEffect(() => {
    const canvaDiv = document.querySelector('.canva') as HTMLElement;
    if (canvaDiv) {
      canvaDiv.style.transform = `scale(${zoom})`;
      canvaDiv.style.transformOrigin = 'top left'; // Cambiado a 'top left'
    }
  }, [zoom]);

  // restablecer zoom
  useEffect(() => {
    setZoom(initialZoom)
  }, [imageIndex]);

  // Renderizar rectangulos segun imagen
  useEffect(() => {
    if (editor?.canvas) {
      editor.canvas.selection = false;
      renderSelectedImage(editor, imageIndex, Files, imageFigures);
    }
  }, [imageIndex, Files, imageFigures, editor]);

  // Event listeners para teclas 
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Chequear si el elemento activo no es un input, textarea, etc.
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (event.ctrlKey && event.key === 'z') {
          event.preventDefault();
          if (isDrawingPolygon) {
            removeLastPoint(); // Llamar a la función que maneja la eliminación
          }
        } else {
          switch (event.key) {
            case 'z':
            case 'Z':
              event.preventDefault();
              if (!isDrawingPolygon) {
                setZoomInactive(!zoomInactive);
              }
              break;
            case 'r':
            case 'R':
              event.preventDefault();
              if (Files.length > 0) {
                if (!currentClass) {
                  toast(`Please select a class`, {
                    icon: <IconXboxX />,
                    style: {
                      borderRadius: '10px',
                      background: '#333',
                      color: '#fff',
                    }
                  });
                  return;
                }
                setCurrentShape('rectangle');
                setIsDrawing(true);
                setZoomInactive(true);

                // Mostrar la notificación de dibujo
                const toastId = showDrawingToast('rectangle');
                setRectangleToastId(toastId); // Guardar el ID del toast para cerrarlo después
              } else {
                toast(`Please upload images`, {
                  icon: <IconXboxX />,
                  style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                  }
                });
              }
              break;
            case 'P':
            case 'p':
              event.preventDefault();
              if (Files.length > 0) {
                setCurrentShape('polygon');
                startDrawingPolygon();
                setZoomInactive(true);
              } else {
                toast(`Please upload images`, {
                  icon: <IconXboxX />,
                  style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                  }
                });
              }
              break;
            case 'C':
            case 'c':
              event.preventDefault();
              if (Files.length > 0) {
                if (!currentClass) {
                  toast(`Please select a class`, {
                    icon: <IconXboxX />,
                    style: {
                      borderRadius: '10px',
                      background: '#333',
                      color: '#fff',
                    }
                  });
                  return;
                }
                setCurrentShape('circle');
                setIsDrawing(true);
                setZoomInactive(true);

                // Mostrar la notificación de dibujo
                const toastId = showDrawingToast('circle');
                setCircleToastId(toastId); // Guardar el ID del toast para cerrarlo después
              } else {
                toast(`Please upload images`, {
                  icon: <IconXboxX />,
                  style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                  }
                });
              }
              break;
            case 'f':
            case 'F':
              event.preventDefault();
              document.getElementById('imageInput')?.click();
              break;
            case 'd':
            case 'D':
              event.preventDefault();
              handleDeleteShape();
              break;
            case 'b':
            case 'B':
              event.preventDefault();
              toggleLockRectangle();
          }
        }
      }
    };

    document.body.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomInactive, isDrawingPolygon, removeLastPoint,
      Files, currentClass, isDrawing, startDrawingPolygon,
    handleDeleteShape, toggleLockRectangle, showDrawingToast
  ]);

  // escuchar si ctrl esta precionado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        setZoomInactive(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey) {
        setZoomInactive(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);


  // Agregar Rectangulos
  useEffect(() => {
    if (!editor || !isDrawing || currentShape !== 'rectangle') return;

    const canvas = editor.canvas;

    canvas.selection = false;
    canvas.forEachObject((obj) => {
      obj.selectable = false;
    });

    let rect, isDragging = false, origX = 0, origY = 0, label;

    canvas.on('mouse:down', (o) => {
      isDragging = true;
      const pointer = canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;
      rect = new fabric.Rect({
        left: origX,
        top: origY,
        originX: 'left',
        originY: 'top',
        width: 0,
        height: 0,
        fill: '#ff000042',
        stroke: '#ff0000',
        strokeWidth: 1,
        strokeUniform: true,
        transparentCorners: false,
        selectable: false
      });
      canvas.add(rect);
    });

    canvas.on('mouse:move', (o) => {
      if (!isDragging) return;
      const pointer = canvas.getPointer(o.e);
      rect.set({
        width: Math.abs(pointer.x - origX),
        height: Math.abs(pointer.y - origY)
      });
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      isDragging = false;
      setIsDrawing(false);

      if (rectangleToastId) {
        closeDrawingToast(rectangleToastId);
        setRectangleToastId(null); // Restablecer el ID del toast
      }

      if (rect.width < 5 || rect.height < 5) {
        canvas.remove(rect);
        toast.error('Rectangle too small. Minimum size is 5x5 pixels.');
        return;
      }

      let fontSize = Math.min(rect.width, rect.height) / 5; // Start with a proportional size
      label = new fabric.Text(currentClass || 'Label', {
        fontSize,
        fontFamily: 'Segoe UI',
      });

      // Adjust font size until the text fits the rectangle
      while (label.width > rect.width || label.height > rect.height) {
        fontSize -= 1;
        label.set({ fontSize: fontSize });
        label.initDimensions(); // Update dimensions after setting new font size
      }

      label.set({
        left: rect.left,
        top: rect.top,
        fill: '#000',
        backgroundColor: '#ffffff90'
      });

      const group = new fabric.Group([rect, label], {
        left: rect.left,
        top: rect.top,
        id: cuid()
      });

      canvas.remove(rect, label);
      canvas.add(group);

      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
      });

      addShape({
        id: group.id,
        className: currentClass,
        shape_type: 'rectangle', // Especificar que es un rectángulo
        points: [], // No hay puntos para los rectángulos
        object: group
      }, imageIndex ?? 0);

      console.log('RECT', rect)

      toast('Created rectangle', {
        icon: <IconSquarePlus2 />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    });

    return () => {
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
      });
    };
  }, [editor, isDrawing, currentShape, currentClass, setIsDrawing, rectangleToastId, addShape, imageIndex, closeDrawingToast]);

  // Polygon
  useEffect(() => {
    if (!editor) return;

    if (isDrawingPolygon) {
      editor.canvas.on('mouse:down', addPolygonPoint);
    } else {
      editor.canvas.off('mouse:down', addPolygonPoint);
    }

    return () => {
      editor.canvas.off('mouse:down', addPolygonPoint);
    };
  }, [editor, isDrawingPolygon, points]);

  // Agregar Circulos
  useEffect(() => {
    if (!editor || !isDrawing || currentShape !== 'circle') return;

    const canvas = editor.canvas;
    let circle, isDragging = false, origX = 0, origY = 0;

    canvas.on('mouse:down', (o) => {
      isDragging = true;
      const pointer = canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;
      circle = new fabric.Circle({
        id: cuid(), // Asigna un ID único aquí
        left: origX,
        top: origY,
        originX: 'center',
        originY: 'center',
        radius: 0,
        fill: '#ff000042',
        stroke: '#ff0000',
        strokeWidth: 1,
        strokeUniform: true,
        selectable: true // Permitir selección y redimensión
      });
      canvas.add(circle);
    });

    canvas.on('mouse:move', (o) => {
      if (!isDragging) return;
      const pointer = canvas.getPointer(o.e);
      const radius = Math.sqrt(Math.pow(pointer.x - origX, 2) + Math.pow(pointer.y - origY, 2));
      circle.set({
        radius: radius,
        left: origX,
        top: origY,
      });
      canvas.renderAll();
    });

    canvas.on('mouse:up', (o) => {
      isDragging = false;
      setIsDrawing(false);

      if (circleToastId) {
        closeDrawingToast(circleToastId);
        setCircleToastId(null);
      }

      if (circle.radius < 5) {
        canvas.remove(circle);
        toast.error('Circle too small. Minimum radius is 5 pixels.');
        return;
      }

      // Calcular las coordenadas del centro del círculo en relación con la imagen
      const centerX = circle.left;
      const centerY = circle.top;

      const label = new fabric.Text(currentClass || 'Label', {
        fontSize: 14,
        fontFamily: 'Segoe UI',
        left: circle.left,
        top: circle.top,
        fill: '#000',
        backgroundColor: '#ffffff90',
        originX: 'center',
        originY: 'center'
      });

      const group = new fabric.Group([circle, label], {
        id: circle.id // Utilizar el mismo ID que se asignó al círculo
      });

      canvas.remove(circle, label);
      canvas.add(group);

      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
      });

      addShape({
        id: group.id,
        className: currentClass,
        shape_type: 'circle',
        center: { x: centerX, y: centerY },
        radius: circle.radius,
        object: group
      }, imageIndex ?? 0);

      toast('Created circle', {
        icon: <IconCirclePlus />,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      });
    });

    return () => {
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
      });
    };
  }, [editor, isDrawing, currentShape, currentClass, setIsDrawing, circleToastId, addShape, imageIndex, closeDrawingToast]);

  useEffect(() => {
  }, [currentShape]);


  useEffect(() => {
    if (!editor) return;

    const canvas = editor.canvas;

    const handleObjectModified = (e) => {
      const modifiedObject = e.target;

      if (!modifiedObject) return;

      const { id } = modifiedObject;
      if (id) {
        // Determina si el objeto modificado es un círculo dentro de un grupo
        const circle = modifiedObject._objects.find(obj => obj.type === 'circle');
        if (circle) {
          const newCenterX = modifiedObject.left + (circle.left + circle.radius * circle.scaleX) * modifiedObject.scaleX;
          const newCenterY = modifiedObject.top + (circle.top + circle.radius * circle.scaleY) * modifiedObject.scaleY;
          const newRadius = circle.radius * circle.scaleX * modifiedObject.scaleX;

          updateShape(id, 'circle', newCenterX, newCenterY, newRadius);
        }
      }
    };

    const updateShape = (id, shapeType, centerX, centerY, radius) => {
      const imageIndex = useAppState.getState().imageIndex;
      if (imageIndex !== undefined) {
        const imageFigures = useAppState.getState().imageFigures;
        const imageFigure = imageFigures.find(fig => fig.imageIndex === imageIndex);

        if (imageFigure) {
          const shapeIndex = imageFigure.shapes.findIndex(shape => shape.id === id);

          if (shapeIndex !== -1) {
            const updatedShapes = [...imageFigure.shapes];
            const updatedShape = { ...updatedShapes[shapeIndex] };

            updatedShape.center = {
              x: centerX,
              y: centerY,
            };
            updatedShape.radius = radius;

            updatedShapes[shapeIndex] = updatedShape;
            useAppState.setState(state => {
              const updatedImageFigures = state.imageFigures.map(fig => fig.imageIndex === imageIndex ? { ...fig, shapes: updatedShapes } : fig);
              return { imageFigures: updatedImageFigures };
            });
          }
        }
      }
    };

    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('object:modified', handleObjectModified);
    };
  }, [editor]);




  return (
    <div className={styles.divContainer}>
      {loading && (
        <Center className={styles.loader}>
          <Loader size="xl" />
        </Center>
      )}
      <div className={styles.divTools}>
        <div className={styles.buttonTool}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            id="imageInput"
            onInput={handleFileInputChange}
            multiple
          />
          <Tooltip label={<IconSquareLetterF />}>
            <button className={styles.buttonNone} onClick={() => document.getElementById('imageInput')?.click()}>
              <IconPhotoUp size="1.8rem" />
              <span className={styles.ButtonSpan}>File</span>
            </button>
          </Tooltip>
        </div>

        <div className={styles.buttonTool}>
          <Tooltip label="Fit Image">
            <button className={styles.buttonNone} onClick={handleFitImage}>
              <IconArrowsMaximize size="1.8rem" />
              <span className={styles.ButtonSpan}>Fit Image</span>
            </button>
          </Tooltip>
        </div>


        {/* <div className={styles.buttonTool}>
          <Tooltip label={<IconSquareLetterZ />}>
            <button
              className={`${styles.buttonNone} ${zoomInactive ? styles.zoomInactive : styles.zoomActive}`}
              onClick={() => !isDrawingPolygon && setZoomInactive(!zoomInactive)}
              disabled={isDrawingPolygon}
            >
              <IconZoomIn size="1.8rem" />
              <span className={styles.ButtonSpan}>Zoom</span>
            </button>
          </Tooltip>
        </div> */}

        <div className={styles.buttonTool}>
          <Tooltip label={<IconSquareLetterR />}>
            <button className={styles.buttonNone} disabled={!cropImage} onClick={handleAddRectangleButtonClick}>
              <IconSquarePlus2 size="1.8rem" />
              <span className={styles.ButtonSpan}>Rectangle</span>
            </button>
          </Tooltip>
        </div>

        <div className={styles.buttonTool}>
          <Tooltip label="Polygon">
            <button className={styles.buttonNone} disabled={!cropImage} onClick={handleAddPolygonButtonClick}>
              <IconPolygon size="1.8rem" />
              <span className={styles.ButtonSpan}>Polygon</span>
            </button>
          </Tooltip>
        </div>

        <div className={styles.buttonTool}>
          <Tooltip label="Circle">
            <button className={styles.buttonNone} disabled={!cropImage} onClick={handleAddCircleButtonClick}>
              <IconCirclePlus size="1.8rem" />
              <span className={styles.ButtonSpan}>Circle</span>
            </button>
          </Tooltip>
        </div>


        <div className={styles.buttonTool}>
          <Tooltip label="Block/Unblock">
            <button className={styles.buttonNone} onClick={toggleLockRectangle}>
              <IconLockAccess size="1.8rem" />
              <span className={styles.ButtonSpan}>Block</span>
            </button>
          </Tooltip>
        </div>


        <div className={styles.buttonTool}>
          <Tooltip label={<IconSquareLetterD />}>
            <button className={styles.buttonNone} disabled={!cropImage} onClick={() => handleDeleteShape()}>
              <IconTrash size="1.8rem" />
              <span className={styles.ButtonSpan}>Delete</span>
            </button>
          </Tooltip>
        </div>

      </div>

      <div className={styles.divCanva}>
        <div
          className='canva'
          style={{
            width: '98%',
            height: '98%',
            transformOrigin: 'top left',
          }}
        >
          <FabricJSCanvas
            className={styles.fabricCanva}
            onReady={onReady}
          />
        </div>
      </div>
    </div>
  )
}