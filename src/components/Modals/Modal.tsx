import { ReactNode } from 'react';
import { Modal } from '@mantine/core';

interface ModalComponentProps {
    opened: boolean
    close: () => void
    children: ReactNode;
}

const ModalComponent = (props: ModalComponentProps) => {

  return (
    <Modal 
      opened={props.opened}
      onClose={props.close}
    >
      {props.children}
    </Modal>
  );
}

export default ModalComponent;
