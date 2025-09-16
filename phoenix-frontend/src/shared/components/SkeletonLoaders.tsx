/**
 * 🎭 Skeleton Loaders Intelligents - Phoenix Design System
 * 
 * Composants de chargement contextuel qui imitent la structure
 * des composants finaux pour une transition fluide.
 */

import React from 'react';
import { DesignTokens, combineClasses, getModuleStyles } from '../ui';

// 🎨 Animation de base pour tous les skeletons
const skeletonAnimation = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200";

interface SkeletonProps {
  className?: string;
  module?: 'aube' | 'cv' | 'letters' | 'rise';
}

// ⭐ Skeleton pour les insights narratifs
export const NarrativeInsightSkeleton: React.FC<SkeletonProps> = ({ className, module }) => {
  const moduleStyles = module ? getModuleStyles(module) : null;
  
  return (
    <div className={combineClasses(
      "p-4 rounded-lg border space-y-3",
      module ? `bg-gradient-to-r ${moduleStyles?.bg}` : "bg-gray-50",
      className || ""
    )}>
      {/* Header avec icône */}
      <div className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full ${skeletonAnimation}`} />
        <div className={`h-4 w-32 rounded ${skeletonAnimation}`} />
      </div>
      
      {/* Lignes de contenu */}
      <div className="space-y-2">
        <div className={`h-3 w-full rounded ${skeletonAnimation}`} />
        <div className={`h-3 w-4/5 rounded ${skeletonAnimation}`} />
        <div className={`h-3 w-3/5 rounded ${skeletonAnimation}`} />
      </div>
    </div>
  );
};

// 🎯 Skeleton pour les métriques/scores
export const MetricCardSkeleton: React.FC<SkeletonProps> = ({ className, module }) => {
  const moduleStyles = module ? getModuleStyles(module) : null;
  
  return (
    <div className={combineClasses(
      "p-4 rounded-lg border text-center",
      module ? `bg-gradient-to-r ${moduleStyles?.bg}` : "bg-gray-50",
      className || ""
    )}>
      {/* Score principal */}
      <div className={`mx-auto mb-2 w-16 h-16 rounded-full ${skeletonAnimation}`} />
      
      {/* Label */}
      <div className={`h-3 w-20 mx-auto rounded ${skeletonAnimation}`} />
    </div>
  );
};

// 📝 Skeleton pour liste d'actions
export const ActionListSkeleton: React.FC<SkeletonProps> = ({ className, module }) => {
  return (
    <div className={combineClasses("space-y-3", className || "")}>
      {[1, 2, 3].map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
          <div className={`w-4 h-4 rounded-full ${skeletonAnimation}`} />
          <div className={`h-3 flex-1 rounded ${skeletonAnimation}`} />
          <div className={`w-4 h-4 rounded ${skeletonAnimation}`} />
        </div>
      ))}
    </div>
  );
};

// 💬 Skeleton pour message Luna
export const LunaMessageSkeleton: React.FC<SkeletonProps> = ({ className, module }) => {
  const moduleStyles = module ? getModuleStyles(module) : null;
  
  return (
    <div className={combineClasses(
      "p-4 rounded-lg",
      module ? `bg-gradient-to-r ${moduleStyles?.bg}` : "bg-indigo-50",
      className || ""
    )}>
      <div className="flex items-start space-x-3">
        {/* Avatar Luna */}
        <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
          🌙
        </div>
        
        <div className="flex-1 space-y-2">
          {/* Nom Luna */}
          <div className={`h-3 w-24 rounded ${skeletonAnimation}`} />
          
          {/* Message lines */}
          <div className="space-y-1">
            <div className={`h-3 w-full rounded ${skeletonAnimation}`} />
            <div className={`h-3 w-3/4 rounded ${skeletonAnimation}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎭 Skeleton pour le header de sidebar complète
export const SidebarHeaderSkeleton: React.FC<SkeletonProps> = ({ className, module }) => {
  const moduleStyles = module ? getModuleStyles(module) : null;
  
  return (
    <div className={combineClasses(
      "p-4 text-white",
      module ? `bg-gradient-to-r ${moduleStyles?.primary}` : "bg-gradient-to-r from-gray-400 to-gray-600",
      className || ""
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full" />
          <div className="space-y-1">
            <div className="h-4 w-20 bg-white/40 rounded" />
            <div className="h-3 w-16 bg-white/30 rounded" />
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <div className="h-3 w-16 bg-white/30 rounded" />
          <div className="h-3 w-8 bg-white/30 rounded" />
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="h-2 bg-white rounded-full w-3/5" />
        </div>
      </div>
    </div>
  );
};

// 🌟 Skeleton complet pour LunaNarrativePreview
export const LunaNarrativePreviewSkeleton: React.FC<SkeletonProps> = ({ module = 'aube' }) => {
  return (
    <div className="fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-white border-l shadow-2xl z-40">
      <div className="h-full flex flex-col">
        
        {/* Header */}
        <SidebarHeaderSkeleton module={module} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Chapitre actuel */}
          <NarrativeInsightSkeleton module={module} />
          
          {/* Insights */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 rounded ${skeletonAnimation}`} />
              <div className={`h-4 w-32 rounded ${skeletonAnimation}`} />
            </div>
            <div className="space-y-2">
              <NarrativeInsightSkeleton module={module} />
              <NarrativeInsightSkeleton module={module} />
            </div>
          </div>
          
          {/* Actions suggérées */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 rounded ${skeletonAnimation}`} />
              <div className={`h-4 w-28 rounded ${skeletonAnimation}`} />
            </div>
            <ActionListSkeleton module={module} />
          </div>
          
          {/* Message Luna */}
          <LunaMessageSkeleton module={module} />
        </div>

        {/* Footer metrics */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            {[1, 2, 3].map((_, index) => (
              <MetricCardSkeleton key={index} className="flex-1 mx-1" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎨 Skeleton pour les composants de page
export const PageContentSkeleton: React.FC<SkeletonProps> = ({ className, module }) => {
  return (
    <div className={combineClasses("max-w-6xl mx-auto p-6 space-y-6", className || "")}>
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={`h-8 w-64 mx-auto rounded ${skeletonAnimation}`} />
        <div className={`h-4 w-96 mx-auto rounded ${skeletonAnimation}`} />
      </div>
      
      {/* Grid de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="p-6 rounded-lg border bg-white space-y-4">
            <div className={`w-12 h-12 rounded-lg mx-auto ${skeletonAnimation}`} />
            <div className={`h-5 w-32 mx-auto rounded ${skeletonAnimation}`} />
            <div className="space-y-2">
              <div className={`h-3 w-full rounded ${skeletonAnimation}`} />
              <div className={`h-3 w-4/5 rounded ${skeletonAnimation}`} />
              <div className={`h-3 w-3/5 rounded ${skeletonAnimation}`} />
            </div>
            <div className={`h-10 w-full rounded-lg ${skeletonAnimation}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 🚀 Skeleton avec animations staggerées pour les listes
export const StaggeredListSkeleton: React.FC<{ items?: number; module?: 'aube' | 'cv' | 'letters' | 'rise' }> = ({ 
  items = 4, 
  module 
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="animate-in slide-in-from-left duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <NarrativeInsightSkeleton module={module} />
        </div>
      ))}
    </div>
  );
};