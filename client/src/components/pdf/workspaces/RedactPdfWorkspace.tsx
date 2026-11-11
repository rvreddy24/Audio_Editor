import React from 'react';
import { SejdaPdfEditor } from '../editor/SejdaPdfEditor';

interface RedactPdfWorkspaceProps {
  onBack: () => void;
}

export const RedactPdfWorkspace: React.FC<RedactPdfWorkspaceProps> = ({ onBack }) => {
  return <SejdaPdfEditor mode="redact" onBack={onBack} />;
};
