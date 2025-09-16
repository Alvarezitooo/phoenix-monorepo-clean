import React, { memo, Suspense } from 'react';
import { User, Building, Calendar, Plus, Trash2, Save, Download, Sparkles, Loader2 } from 'lucide-react';
import { useCVBuilder } from '../hooks/useCVBuilder';
import type { CVTemplate, Experience, Education } from '../hooks/useCVBuilder';

interface CVBuilderTabProps {
  selectedTemplateId?: string;
}

const CVBuilderTab = memo(({ selectedTemplateId }: CVBuilderTabProps = {}) => {
  const { 
    form, 
    templates, 
    result, 
    isBuilding, 
    isLoadingTemplates,
    buildCV,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    selectTemplate,
    getSelectedTemplate
  } = useCVBuilder();

  // 🎯 Pré-sélectionner le template si fourni depuis la Gallery
  React.useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== form.selectedTemplate) {
      selectTemplate(selectedTemplateId);
    }
  }, [selectedTemplateId, selectTemplate, form.selectedTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await buildCV(form);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la génération du CV');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="h-8 w-8 text-indigo-500" />
          <div>
            <h3 className="text-xl font-bold text-gray-800">Générateur CV Professionnel</h3>
            <p className="text-gray-600">Créez un CV optimisé avec nos templates professionnels</p>
          </div>
          <div className="px-3 py-1 bg-indigo-100 rounded-full text-sm font-medium text-indigo-700">20⚡</div>
        </div>

        <Suspense fallback={<LoadingTemplates />}>
          <TemplateSelector 
            templates={templates}
            selectedTemplate={form.selectedTemplate}
            onSelectTemplate={selectTemplate}
            isLoading={isLoadingTemplates}
          />
        </Suspense>
      </div>

      {/* Build Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <PersonalInfoSection 
          personalInfo={form.personalInfo}
          onUpdate={updatePersonalInfo}
        />

        {/* Experience Section */}
        <ExperienceSection
          experiences={form.experiences}
          onAddExperience={addExperience}
          onUpdateExperience={updateExperience}
          onRemoveExperience={removeExperience}
        />

        {/* Education Section */}
        <EducationSection
          education={form.education}
          onAddEducation={addEducation}
          onUpdateEducation={updateEducation}
          onRemoveEducation={removeEducation}
        />

        {/* Skills Section */}
        <SkillsSection
          skills={form.skills}
          onUpdateSkills={updateSkills}
        />

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isBuilding}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isBuilding ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Luna génère votre CV...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Générer mon CV</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {result && (
        <CVBuilderResults result={result} selectedTemplate={getSelectedTemplate()} />
      )}
    </div>
  );
});

const LoadingTemplates = memo(() => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
    <span className="ml-2 text-gray-600">Chargement des templates...</span>
  </div>
));

const TemplateSelector = memo(({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate, 
  isLoading 
}: {
  templates: CVTemplate[];
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  isLoading: boolean;
}) => {
  if (isLoading) return <LoadingTemplates />;

  // Organiser par catégorie
  const categories = templates.reduce((acc, template) => {
    const category = template.category || 'Autre';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, CVTemplate[]>);

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-800">Choisissez votre template</h4>
      
      {Object.entries(categories).map(([categoryName, categoryTemplates]) => (
        <div key={categoryName} className="space-y-3">
          <h5 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
            {categoryName} ({categoryTemplates.length})
          </h5>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-800">{template.name}</h6>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      {template.ats_compatible && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          ATS ✓
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {template.popularity}% populaire
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.sectors.slice(0, 2).map((sector, idx) => (
                        <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {sector}
                        </span>
                      ))}
                      {template.sectors.length > 2 && (
                        <span className="text-xs text-gray-500">+{template.sectors.length - 2}</span>
                      )}
                    </div>
                  </div>
                  
                  {selectedTemplate === template.id && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

const PersonalInfoSection = memo(({ 
  personalInfo, 
  onUpdate 
}: {
  personalInfo: any;
  onUpdate: (field: string, value: string) => void;
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <div className="flex items-center space-x-3 mb-6">
      <User className="h-6 w-6 text-blue-500" />
      <h4 className="text-lg font-semibold text-gray-800">Informations personnelles</h4>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
        <input
          type="text"
          value={personalInfo.firstName}
          onChange={(e) => onUpdate('firstName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Jean"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
        <input
          type="text"
          value={personalInfo.lastName}
          onChange={(e) => onUpdate('lastName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Dupont"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
        <input
          type="email"
          value={personalInfo.email}
          onChange={(e) => onUpdate('email', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="jean.dupont@email.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
        <input
          type="tel"
          value={personalInfo.phone}
          onChange={(e) => onUpdate('phone', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+33 1 23 45 67 89"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
        <input
          type="text"
          value={personalInfo.address}
          onChange={(e) => onUpdate('address', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Paris, France"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
        <input
          type="url"
          value={personalInfo.linkedIn}
          onChange={(e) => onUpdate('linkedIn', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://linkedin.com/in/jeandupont"
        />
      </div>
    </div>

    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Résumé professionnel</label>
      <textarea
        value={personalInfo.summary}
        onChange={(e) => onUpdate('summary', e.target.value)}
        className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Décrivez brièvement votre profil professionnel..."
      />
    </div>
  </div>
));

const ExperienceSection = memo(({ 
  experiences, 
  onAddExperience, 
  onUpdateExperience, 
  onRemoveExperience 
}: {
  experiences: Experience[];
  onAddExperience: () => void;
  onUpdateExperience: (index: number, field: string, value: any) => void;
  onRemoveExperience: (index: number) => void;
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <Building className="h-6 w-6 text-emerald-500" />
        <h4 className="text-lg font-semibold text-gray-800">Expériences professionnelles</h4>
      </div>
      <button
        type="button"
        onClick={onAddExperience}
        className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Ajouter</span>
      </button>
    </div>

    {experiences.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Aucune expérience ajoutée. Cliquez sur "Ajouter" pour commencer.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {experiences.map((experience, index) => (
          <ExperienceCard
            key={index}
            experience={experience}
            index={index}
            onUpdate={onUpdateExperience}
            onRemove={onRemoveExperience}
          />
        ))}
      </div>
    )}
  </div>
));

const ExperienceCard = memo(({ 
  experience, 
  index, 
  onUpdate, 
  onRemove 
}: {
  experience: Experience;
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}) => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
    <div className="flex items-center justify-between">
      <h5 className="font-medium text-gray-800">Expérience #{index + 1}</h5>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
        <input
          type="text"
          value={experience.company}
          onChange={(e) => onUpdate(index, 'company', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Nom de l'entreprise"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
        <input
          type="text"
          value={experience.position}
          onChange={(e) => onUpdate(index, 'position', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Titre du poste"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
        <input
          type="date"
          value={experience.startDate}
          onChange={(e) => onUpdate(index, 'startDate', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
        <input
          type="date"
          value={experience.endDate}
          onChange={(e) => onUpdate(index, 'endDate', e.target.value)}
          disabled={experience.current}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
        />
        <div className="mt-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={experience.current}
              onChange={(e) => onUpdate(index, 'current', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Poste actuel</span>
          </label>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        value={experience.description}
        onChange={(e) => onUpdate(index, 'description', e.target.value)}
        className="w-full h-20 p-2 border border-gray-300 rounded resize-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
        placeholder="Décrivez vos responsabilités et accomplissements..."
      />
    </div>
  </div>
));

const EducationSection = memo(({ 
  education, 
  onAddEducation, 
  onUpdateEducation, 
  onRemoveEducation 
}: {
  education: Education[];
  onAddEducation: () => void;
  onUpdateEducation: (index: number, field: string, value: string) => void;
  onRemoveEducation: (index: number) => void;
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-6 w-6 text-orange-500" />
        <h4 className="text-lg font-semibold text-gray-800">Formation</h4>
      </div>
      <button
        type="button"
        onClick={onAddEducation}
        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Ajouter</span>
      </button>
    </div>

    {education.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Aucune formation ajoutée.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {education.map((edu, index) => (
          <EducationCard
            key={index}
            education={edu}
            index={index}
            onUpdate={onUpdateEducation}
            onRemove={onRemoveEducation}
          />
        ))}
      </div>
    )}
  </div>
));

const EducationCard = memo(({ 
  education, 
  index, 
  onUpdate, 
  onRemove 
}: {
  education: Education;
  index: number;
  onUpdate: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}) => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
    <div className="flex items-center justify-between">
      <h5 className="font-medium text-gray-800">Formation #{index + 1}</h5>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Établissement</label>
        <input
          type="text"
          value={education.institution}
          onChange={(e) => onUpdate(index, 'institution', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
          placeholder="Université, École..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Diplôme</label>
        <input
          type="text"
          value={education.degree}
          onChange={(e) => onUpdate(index, 'degree', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
          placeholder="Master, Licence..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
        <input
          type="text"
          value={education.field}
          onChange={(e) => onUpdate(index, 'field', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
          placeholder="Informatique, Marketing..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Année d'obtention</label>
        <input
          type="text"
          value={education.graduationYear}
          onChange={(e) => onUpdate(index, 'graduationYear', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
          placeholder="2023"
        />
      </div>
    </div>
  </div>
));

const SkillsSection = memo(({ 
  skills, 
  onUpdateSkills 
}: {
  skills: string[];
  onUpdateSkills: (skills: string[]) => void;
}) => {
  const [newSkill, setNewSkill] = React.useState('');

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onUpdateSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onUpdateSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <Sparkles className="h-6 w-6 text-purple-500" />
        <h4 className="text-lg font-semibold text-gray-800">Compétences</h4>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ajouter une compétence..."
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const CVBuilderResults = memo(({ 
  result, 
  selectedTemplate 
}: {
  result: any;
  selectedTemplate?: CVTemplate;
}) => (
  <div className="space-y-6">
    {/* Success Header */}
    <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100 text-center">
      <div className="flex items-center justify-center space-x-4 mb-4">
        <Sparkles className="h-8 w-8 text-emerald-500" />
        <div>
          <h3 className="text-2xl font-bold text-gray-800">CV Généré avec Succès!</h3>
          <p className="text-emerald-600 font-medium">Template: {selectedTemplate?.name}</p>
        </div>
      </div>
    </div>

    {/* Generated CV */}
    <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-gray-800">📄 Votre CV Professionnel</h4>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Copier</span>
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
          {result.cv_content}
        </pre>
      </div>

      <div className="mt-4 text-center">
        <span className="text-sm text-indigo-600">
          {result.energy_consumed}⚡ énergie consommée pour cette génération
        </span>
      </div>
    </div>
  </div>
));

CVBuilderTab.displayName = 'CVBuilderTab';
TemplateSelector.displayName = 'TemplateSelector';
PersonalInfoSection.displayName = 'PersonalInfoSection';
ExperienceSection.displayName = 'ExperienceSection';
EducationSection.displayName = 'EducationSection';
SkillsSection.displayName = 'SkillsSection';

export default CVBuilderTab;