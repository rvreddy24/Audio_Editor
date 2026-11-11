import React from 'react';
import { SejdaPdfEditor } from '../editor/SejdaPdfEditor';

interface SignWorkspaceProps {
  onBack: () => void;
}

export const SignWorkspace: React.FC<SignWorkspaceProps> = ({ onBack }) => {
  return <SejdaPdfEditor mode="sign" onBack={onBack} />;
};
