import React from 'react';
import { PdfCanvasEditor } from '../editor/PdfCanvasEditor';

interface SignWorkspaceProps {
  onBack: () => void;
}

export const SignWorkspace: React.FC<SignWorkspaceProps> = ({ onBack }) => {
  return <PdfCanvasEditor mode="sign" onBack={onBack} />;
};
