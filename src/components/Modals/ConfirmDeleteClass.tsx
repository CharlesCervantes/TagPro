import { Modal, Button, Group, Text, Divider } from '@mantine/core';
import styles from './modals.module.scss';

interface ConfirmDeleteClassModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    className: string;
}

export function ConfirmDeleteClassModal({ opened, onClose, onConfirm, className }: ConfirmDeleteClassModalProps) {
    return (
        <Modal opened={opened} onClose={onClose} withCloseButton={false}>
            <Modal.Title className={styles.modalTitle}>Confirm delete</Modal.Title>
            <Divider color='red' size="sm" />
            <Modal.Body>
                <Text>
                    Are you sure to remove the class "{className}"? This will remove all tags associated with this class.
                </Text>
            </Modal.Body>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <Button style={{ marginRight: '8px' }} onClick={onClose} color="red" variant='outline'>
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="red">
                    Confirm
                </Button>
            </div>
        </Modal>
    );
}
