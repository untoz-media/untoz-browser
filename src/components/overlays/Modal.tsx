import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './Dialog';

// Re-export Dialog components as Modal equivalents for clarity
export const Modal = Dialog;
export const ModalTrigger = DialogTrigger;
export const ModalContent = DialogContent;
export const ModalHeader = DialogHeader;
export const ModalTitle = DialogTitle;
export const ModalDescription = DialogDescription;

export type {
  DialogProps as ModalProps,
  DialogTriggerProps as ModalTriggerProps,
  DialogContentProps as ModalContentProps
};

export default Modal;