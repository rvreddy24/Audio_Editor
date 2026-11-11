import React from 'react';
import { SejdaPdfEditor } from '../editor/SejdaPdfEditor';

interface EditPdfWorkspaceProps {
  onBack: () => void;
}

export const EditPdfWorkspace: React.FC<EditPdfWorkspaceProps> = ({ onBack }) => {
  return <SejdaPdfEditor mode="edit" onBack={onBack} />;
};
