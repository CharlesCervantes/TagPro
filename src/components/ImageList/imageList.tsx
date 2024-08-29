import React, { useEffect, useState } from 'react';
import { Accordion, Button, Checkbox, Divider, Modal, Text } from '@mantine/core';
import { IconPhoto, IconTrash, IconPoint } from '@tabler/icons-react';
import { useAppState } from '../../store/app.store';
import styles from './imageList.module.scss';

export function ImageList(): React.ReactElement {
    const { Files, imageIndex, setImageIndex, removeImage, imageFigures, removeAllImages } = useAppState();
    const [imagesWithoutFigures, setImagesWithoutFigures] = useState<File[]>([]);
    const [taggedImages, setTaggedImages] = useState<{ [key: string]: File[] }>({});
    const [showConfirmAllModal, setShowConfirmAllModal] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState<number[]>([]);

    useEffect(() => {
        const filteredImages = Files.filter((file, index) => {
            const imageRect = imageFigures.find(ir => ir.imageIndex === index);
            return !imageRect || imageRect.shapes.length === 0;
        });
        setImagesWithoutFigures(filteredImages);

        const groupedByClass: { [key: string]: File[] } = {};
        imageFigures.forEach(imageRect => {
            imageRect.shapes.forEach(rect => {
                if (!groupedByClass[rect.className]) {
                    groupedByClass[rect.className] = [];
                }
                groupedByClass[rect.className].push(Files[imageRect.imageIndex]);
            });
        });
        setTaggedImages(groupedByClass);
    }, [Files, imageFigures]);

    const handleCheckboxChange = (index: number) => {
        if (selectMode) {
            setSelectedImages(prevSelected => {
                if (prevSelected.includes(index)) {
                    return prevSelected.filter(i => i !== index);
                } else {
                    return [...prevSelected, index];
                }
            });
        } else {
            setImageIndex(index);
        }
    };

    const handleDeleteClick = (index: number) => {
        setDeleteIndex(index);
        setShowModal(true);
    };

    const handleDeleteConfirm = () => {
        if (deleteIndex !== null) {
            removeImage(deleteIndex);
            setShowModal(false);
            setDeleteIndex(null);

            if (deleteIndex === imageIndex) {
                const newIndex = Math.max(imageIndex - 1, 0);
                setImageIndex(newIndex);
            } else if (deleteIndex < imageIndex) {
                setImageIndex(imageIndex - 1);
            }
        }
    };

    const handleDeleteCancel = () => {
        setShowModal(false);
        setDeleteIndex(null);
    };

    const handleRemoveAllImages = () => {
        removeAllImages();
        setShowConfirmAllModal(false);
    };

    const handleRemoveAllClick = () => {
        setShowConfirmAllModal(true);
    };

    const handleConfirmAllCancel = () => {
        setShowConfirmAllModal(false);
    };

    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedImages([]);
    };

    const handleBulkDelete = () => {
        const sortedSelectedImages = [...selectedImages].sort((a, b) => b - a);
        sortedSelectedImages.forEach(index => removeImage(index));
        setSelectedImages([]);
        setSelectMode(false);
    };

    return (
        <div className={styles.divCardImg}>
            <Accordion>
                <Accordion.Item value='allImages'>
                    <Accordion.Control icon={<IconPhoto size="15px" />} style={{ fontSize: '0.7rem' }}>
                        Images
                    </Accordion.Control>
                    <Accordion.Panel>
                        {Files.length > 1 && (
                            <Button
                                color={selectMode ? "red" : "blue"}
                                size="xs"
                                onClick={selectMode ? handleBulkDelete : toggleSelectMode}
                                style={{ display: 'flex', marginBottom: '10px', alignContent: 'center', width: '100%', justifyContent: 'center', padding: '0' }}
                            >
                                {selectMode ? "Delete Selected" : "Select images"}
                            </Button>
                        )}
                        {Files.length > 0 ? (
                            Files.map((image, index) => (
                                <div key={index} className={styles.divImages}>
                                    <Checkbox
                                        onChange={() => handleCheckboxChange(index)}
                                        checked={selectMode ? selectedImages.includes(index) : index === imageIndex}
                                        label={image.name}
                                        size='xs'
                                        style={{ fontSize: '0.7rem' }}
                                    />
                                    {!selectMode && (
                                        <IconTrash size="1rem" className={styles.trashIcon} onClick={() => handleDeleteClick(index)} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <Text size='xs'>No images found.</Text>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <Accordion>
                <Accordion.Item value='unTagged'>
                    <Accordion.Control icon={<IconPhoto size="15px" color='red' />} style={{ fontSize: '0.7rem' }}>
                        Images without tags
                    </Accordion.Control>
                    <Accordion.Panel>
                        {imagesWithoutFigures.length === 0 ? (
                            <Text size='0.7rem'>No images without rectangles.</Text>
                        ) : (
                            imagesWithoutFigures.map((file, index) => (
                                <div key={index} className={styles.divImages}>
                                    <Checkbox
                                        size='xs'
                                        style={{ fontSize: '0.7rem' }}
                                        label={file.name}
                                        checked={Files.indexOf(file) === imageIndex}
                                        onChange={() => handleCheckboxChange(Files.indexOf(file))}
                                    />
                                    {!selectMode && (
                                        <IconTrash size="1rem" className={styles.trashIcon} onClick={() => handleDeleteClick(Files.indexOf(file))} />
                                    )}
                                </div>
                            ))
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <Accordion classNames={{ content: styles.content }}>
                <Accordion.Item value='tagged'>
                    <Accordion.Control icon={<IconPhoto size="15px" color='green' />} style={{ fontSize: '0.7rem' }}>
                        Tagged Images
                    </Accordion.Control>
                    <Accordion.Panel>
                        {Object.keys(taggedImages).length === 0 ? (
                            <Text size='0.7rem'>No tagged images.</Text>
                        ) : (
                            Object.keys(taggedImages).map(className => (
                                <Accordion key={className} multiple={false}>
                                    <Accordion.Item value={className}>
                                        <Accordion.Control style={{ fontSize: '0.7rem' }} icon={<IconPoint size="15px" />}>
                                            {className} ({taggedImages[className].length})
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            {taggedImages[className].map((file, index) => (
                                                <div key={index} className={styles.divImages}>
                                                    <Checkbox
                                                        size='xs'
                                                        label={file.name}
                                                        checked={Files.indexOf(file) === imageIndex}
                                                        onChange={() => handleCheckboxChange(Files.indexOf(file))}
                                                    />
                                                    {!selectMode && (
                                                        <IconTrash size="1rem" className={styles.trashIcon} onClick={() => handleDeleteClick(Files.indexOf(file))} />
                                                    )}
                                                </div>
                                            ))}
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                </Accordion>
                            ))
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <Modal
                opened={showModal}
                onClose={handleDeleteCancel}
                withCloseButton={false}
            >
                <Modal.Title className={styles.modalTitle}>Delete an image</Modal.Title>
                <Divider color='red' size="sm" />
                <Text align="center">Do you want to delete this image?</Text>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                    <Button color='red' variant='outline' onClick={handleDeleteCancel} style={{ marginRight: '8px' }}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="red">Delete</Button>
                </div>
            </Modal>

            <Modal
                opened={showConfirmAllModal}
                onClose={handleConfirmAllCancel}
                withCloseButton={false}
            >
                <Modal.Title className={styles.modalTitle}>Delete all images</Modal.Title>
                <Divider color='red' size="sm" />
                <Text align="center">Do you want to delete all the images?</Text>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                    <Button color='red' variant='outline' onClick={handleConfirmAllCancel} style={{ marginRight: '8px' }}>Cancel</Button>
                    <Button onClick={handleRemoveAllImages} color="red">Delete all</Button>
                </div>
            </Modal>
        </div>
    );
}
