// Modelos de datos para TypeScript/JavaScript

/**
 * Documento en el vault (cifrado)
 */
export class VaultDocument {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.areaId = data.areaId;
    this.encryptedContent = data.encryptedContent || '';
    this.contentHash = data.contentHash || '';
    this.encryptionMetadata = data.encryptionMetadata || {
      encryptedItemKey: '',
      iv: '',
      salt: '',
      algorithm: 'AES-GCM-256',
      version: '1.0'
    };
    this.metadata = data.metadata || {
      title: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      isFavorite: false,
      icon: '📄'
    };
    this.sharedWith = data.sharedWith || {};
    this.templateId = data.templateId || '';
    this.fieldOrder = data.fieldOrder || [];
    this.version = data.version || 1;
  }
  
  generateId() {
    return 'doc_' + Math.random().toString(36).substr(2, 9);
  }
  
  toFirestore() {
    return {
      id: this.id,
      userId: this.userId,
      areaId: this.areaId,
      encryptedContent: this.encryptedContent,
      contentHash: this.contentHash,
      encryptionMetadata: this.encryptionMetadata,
      metadata: this.metadata,
      sharedWith: this.sharedWith,
      templateId: this.templateId,
      fieldOrder: this.fieldOrder,
      version: this.version
    };
  }
}

/**
 * Plantilla de datos
 */
export class DataTemplate {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.name = data.name || '';
    this.description = data.description || '';
    this.icon = data.icon || '📋';
    this.color = data.color || '#3B82F6';
    this.fields = data.fields || [];
    this.settings = data.settings || {
      allowDuplicates: false,
      maxEntries: 0,
      category: 'personal',
      isSystemTemplate: false,
      version: '1.0'
    };
    this.sharedWith = data.sharedWith || [];
    this.isPublic = data.isPublic || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
  
  generateId() {
    return 'template_' + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Campo de plantilla
 */
export class TemplateField {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.type = data.type || 'string';
    this.label = data.label || '';
    this.placeholder = data.placeholder || '';
    this.required = data.required || false;
    this.sensitive = data.sensitive || false;
    this.validation = data.validation || {};
    this.defaultValue = data.defaultValue || '';
    this.order = data.order || 0;
    this.encryptionLevel = data.encryptionLevel || 'medium';
  }
  
  generateId() {
    return 'field_' + Math.random().toString(36).substr(2, 9);
  }
}
