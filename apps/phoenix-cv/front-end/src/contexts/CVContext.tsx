/**
 * 🗂️ CV Context - Phoenix CV
 * Context pour partager et synchroniser les données CV entre éditeur et aperçu
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CVSection {
  id: string;
  title: string;
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'custom';
  content: any;
  isEditing?: boolean;
  isVisible?: boolean;
}

export interface CVData {
  sections: CVSection[];
  template: string;
  theme: string;
  lastModified: Date;
}

interface CVContextType {
  cvData: CVData;
  updateSection: (sectionId: string, content: any) => void;
  addSection: (section: Omit<CVSection, 'id'>) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  setTemplate: (template: string) => void;
  setTheme: (theme: string) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  resetCV: () => void;
  exportCV: () => CVData;
  importCV: (data: CVData) => void;
}

const CVContext = createContext<CVContextType | undefined>(undefined);

// Données par défaut pour un nouveau CV
const defaultCVData: CVData = {
  sections: [
    {
      id: 'header',
      title: 'Informations Personnelles',
      type: 'header',
      isVisible: true,
      content: {
        name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
      }
    },
    {
      id: 'summary',
      title: 'Résumé Professionnel',
      type: 'summary',
      isVisible: true,
      content: {
        text: ''
      }
    },
    {
      id: 'experience',
      title: 'Expérience Professionnelle',
      type: 'experience',
      isVisible: true,
      content: {
        experiences: []
      }
    },
    {
      id: 'education',
      title: 'Formation',
      type: 'education',
      isVisible: true,
      content: {
        educations: []
      }
    },
    {
      id: 'skills',
      title: 'Compétences',
      type: 'skills',
      isVisible: true,
      content: {
        skills: []
      }
    }
  ],
  template: 'modern',
  theme: 'professional',
  lastModified: new Date()
};

export function CVProvider({ children }: { children: ReactNode }) {
  const [cvData, setCvData] = useState<CVData>(defaultCVData);

  const updateSection = useCallback((sectionId: string, content: any) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, ...content } }
          : section
      ),
      lastModified: new Date()
    }));
  }, []);

  const addSection = useCallback((newSection: Omit<CVSection, 'id'>) => {
    const id = `section-${Date.now()}`;
    setCvData(prev => ({
      ...prev,
      sections: [...prev.sections, { ...newSection, id, isVisible: true }],
      lastModified: new Date()
    }));
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId),
      lastModified: new Date()
    }));
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setCvData(prev => {
      const newSections = [...prev.sections];
      const [movedSection] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedSection);
      
      return {
        ...prev,
        sections: newSections,
        lastModified: new Date()
      };
    });
  }, []);

  const setTemplate = useCallback((template: string) => {
    setCvData(prev => ({
      ...prev,
      template,
      lastModified: new Date()
    }));
  }, []);

  const setTheme = useCallback((theme: string) => {
    setCvData(prev => ({
      ...prev,
      theme,
      lastModified: new Date()
    }));
  }, []);

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setCvData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, isVisible: !section.isVisible }
          : section
      ),
      lastModified: new Date()
    }));
  }, []);

  const resetCV = useCallback(() => {
    setCvData(defaultCVData);
  }, []);

  const exportCV = useCallback(() => {
    return cvData;
  }, [cvData]);

  const importCV = useCallback((data: CVData) => {
    setCvData(data);
  }, []);

  const value: CVContextType = {
    cvData,
    updateSection,
    addSection,
    removeSection,
    reorderSections,
    setTemplate,
    setTheme,
    toggleSectionVisibility,
    resetCV,
    exportCV,
    importCV
  };

  return (
    <CVContext.Provider value={value}>
      {children}
    </CVContext.Provider>
  );
}

export function useCV() {
  const context = useContext(CVContext);
  if (context === undefined) {
    throw new Error('useCV must be used within a CVProvider');
  }
  return context;
}