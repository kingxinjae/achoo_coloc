import React from 'react';
import Toast from './Toast';
import type { ToastType } from './Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          style={{ 
            position: 'fixed',
            top: `${2 + index * 5}rem`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000 + index
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export default ToastContainer;
