import React from 'react';
import { PdfCanvasEditor } from '../editor/PdfCanvasEditor';

interface RedactPdfWorkspaceProps {
  onBack: () => void;
}

export const RedactPdfWorkspace: React.FC<RedactPdfWorkspaceProps> = ({ onBack }) => {
  return <PdfCanvasEditor mode="redact" onBack={onBack} />;
};
