import toast from 'react-hot-toast'
import styles from './classes.module.scss'
import { IconCircleDashedCheck, IconPlus, IconXboxX } from '@tabler/icons-react'
import React, { useState, useEffect } from 'react'
import { Badge, Divider, Tooltip } from '@mantine/core'
import { useAppState } from '../../store/app.store'
import { ConfirmDeleteClassModal } from '../Modals/ConfirmDeleteClass'

export function ClassCard(): React.ReactNode {
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [hoveredTags, setHoveredTags] = useState<boolean[]>([])
    const [className, setClassName] = useState<string>('')
    const { classes, addClass, removeClass, setCurrentClass, currentClass } = useAppState()

    const handleCreateClass = async () => {
        if (className.trim() === '') {
            return
        }

        const lowerCaseClassName = className.toLowerCase();
        if (classes.map(c => c.toLowerCase()).includes(lowerCaseClassName)) {
            toast.error(`Class "${className}" already exists`)
            return
        }

        await addClass(className)
        toast(`'${className}' successfully created`, {
            icon: <IconCircleDashedCheck />,
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            }
        })
        setClassName('') // Limpiar el input después de agregar la clase
        document.getElementById('createClassButton')?.focus();
    }

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && className.trim() !== '') {
        handleCreateClass();
    }
    };


    const handleRemoveTag = (tag: string) => {
        setSelectedClass(tag)
        setDeleteModalOpen(true)
    }

    const confirmDeleteClass = async () => {
        await removeClass(selectedClass)
        toast(` Class '${selectedClass}' removed`, {
            icon: <IconXboxX />,
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            }
        })
        setDeleteModalOpen(false)
    }

    const handleTagHoverEnter = (index: number) => {
        const newHoveredTags = [...hoveredTags]
        newHoveredTags[index] = true
        setHoveredTags(newHoveredTags)
    }

    const handleTagHoverLeave = (index: number) => {
        const newHoveredTags = [...hoveredTags]
        newHoveredTags[index] = false
        setHoveredTags(newHoveredTags)
    }

    const handleSelectClass = (className: string) => {
        setCurrentClass(className)
        toast(`Class '${className}' selected`, {
            icon: <IconCircleDashedCheck />,
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            }
        })
    }

    return (
        <div className={styles.divCard}>
            <div>
                <Divider style={{ marginBottom: '5px' }} />
                <span className={styles.title}>Classes</span>
            </div>

            <div className={styles.content}>
                {classes?.map((tag, index) => (
                    <Tooltip key={tag} label="Select Class">
                        <Badge
                            key={tag}
                            color={tag === currentClass ? 'blue' : 'gray'}
                            style={{
                                padding: '10px',
                                cursor: 'pointer',
                                margin: '5px'
                            }}
                            onClick={() => { handleSelectClass(tag) }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleRemoveTag(tag);
                            }}
                            onMouseEnter={() => { handleTagHoverEnter(index) }}
                            onMouseLeave={() => { handleTagHoverLeave(index) }}
                        >
                            {tag}
                        </Badge>
                    </Tooltip>
                ))}
            </div>

            <div className={styles.input}>
                <div className={styles.divInput}>
                    <input
                        value={className}
                        onChange={(event) => { setClassName(event.currentTarget.value) }}
                        onKeyDown={handleKeyPress}
                        className={styles.inputTag}
                        style={{
                            backgroundColor: '#e4e4e4',
                            border: '0.5px solid gray',
                            outline: 'none',
                            paddingTop: '0.2rem',
                            paddingBottom: '0.2rem'
                        }}
                    />
                    <button
                        id="createClassButton"
                        className={styles.buttonTag}
                        color="gray"
                        onClick={handleCreateClass}
                    >
                        <IconPlus size="0.6rem" />
                    </button>
                </div>
            </div>

            <ConfirmDeleteClassModal
                opened={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteClass}
                className={selectedClass}
            />
        </div>
    )
}

