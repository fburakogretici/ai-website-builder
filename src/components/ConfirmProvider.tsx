"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions | null;
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        options: null,
        resolve: null,
    });

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                options,
                resolve,
            });
        });
    };

    const handleClose = () => {
        if (dialogState.resolve) {
            dialogState.resolve(false);
        }
        setDialogState({ isOpen: false, options: null, resolve: null });
    };

    const handleConfirm = () => {
        if (dialogState.resolve) {
            dialogState.resolve(true);
        }
        setDialogState({ isOpen: false, options: null, resolve: null });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {dialogState.options && (
                <ConfirmDialog
                    isOpen={dialogState.isOpen}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                    title={dialogState.options.title}
                    message={dialogState.options.message}
                    confirmText={dialogState.options.confirmText}
                    cancelText={dialogState.options.cancelText}
                    variant={dialogState.options.variant}
                />
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
