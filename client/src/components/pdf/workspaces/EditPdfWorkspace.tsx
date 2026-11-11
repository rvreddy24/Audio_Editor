import React from 'react';
import { PdfCanvasEditor } from '../editor/PdfCanvasEditor';

interface EditPdfWorkspaceProps {
  onBack: () => void;
}

export const EditPdfWorkspace: React.FC<EditPdfWorkspaceProps> = ({ onBack }) => {
  return <PdfCanvasEditor mode="edit" onBack={onBack} />;
};
