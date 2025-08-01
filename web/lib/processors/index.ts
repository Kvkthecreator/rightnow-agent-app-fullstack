/**
 * Universal Data Processing System
 * 
 * Main entry point for the modular data type processing system.
 * Initializes the registry with current processors and provides
 * the main interfaces for content processing.
 */

import { DataTypeRegistry } from './DataTypeRegistry';
import { UniversalContentProcessor } from './UniversalContentProcessor';
import { TextProcessor } from './TextProcessor';
import { PDFProcessor } from './PDFProcessor';
import { ImageProcessor } from './ImageProcessor';

// Create and initialize the global registry
export const dataTypeRegistry = new DataTypeRegistry();

// Register current processors
dataTypeRegistry.register(new TextProcessor());
dataTypeRegistry.register(new PDFProcessor());
dataTypeRegistry.register(new ImageProcessor());

// Create the universal processor instance
export const universalProcessor = new UniversalContentProcessor(dataTypeRegistry);

// Log initialization
console.log('Universal Data Processing System initialized with processors:', 
           dataTypeRegistry.getSupportedTypes());

// Export types and classes for external use
export * from './types';
export { DataTypeRegistry } from './DataTypeRegistry';
export { UniversalContentProcessor, type ProcessingResult } from './UniversalContentProcessor';
export { TextProcessor } from './TextProcessor';
export { PDFProcessor } from './PDFProcessor';
export { ImageProcessor } from './ImageProcessor';

// Future processor imports will be added here:
// export { AudioProcessor } from './AudioProcessor';
// export { VideoProcessor } from './VideoProcessor';

/**
 * Convenience function for processing mixed content
 * 
 * @param content - Mixed content (text and/or files)
 * @param options - Processing options
 * @returns Processing result with cohesive interpretation
 */
export async function processContent(content: {
  text?: string;
  files?: File[];
}, options = {}) {
  return universalProcessor.processMixedContent(content, options);
}

/**
 * Convenience function for processing individual inputs
 * 
 * @param inputs - Array of text strings and/or files
 * @param options - Processing options
 * @returns Processing result with cohesive interpretation
 */
export async function processInputs(inputs: Array<string | File>, options = {}) {
  return universalProcessor.processMultipleInputs(inputs, options);
}

/**
 * Check if the system can process a given input
 * 
 * @param input - Input to check
 * @returns true if input can be processed
 */
export function canProcessInput(input: unknown): boolean {
  return universalProcessor.canProcess(input);
}

/**
 * Get information about all available processors
 * 
 * @returns Array of processor information
 */
export function getProcessorInfo() {
  return dataTypeRegistry.getProcessorInfo();
}

/**
 * Get processing capabilities for all processors
 * 
 * @returns Map of processor types to their capabilities
 */
export function getProcessingCapabilities() {
  return universalProcessor.getProcessingCapabilities();
}

/**
 * Get supported data types
 * 
 * @returns Array of supported DataTypeIdentifier values
 */
export function getSupportedTypes() {
  return universalProcessor.getSupportedTypes();
}

/**
 * Registry statistics for monitoring and debugging
 * 
 * @returns Statistics about the processor registry
 */
export function getRegistryStats() {
  return dataTypeRegistry.getRegistryStats();
}

// Development utilities (only available in development)
if (process.env.NODE_ENV === 'development') {
  // Make registry available for testing and debugging
  (globalThis as any).__dataTypeRegistry = dataTypeRegistry;
  (globalThis as any).__universalProcessor = universalProcessor;
  
  console.log('Development mode: Registry and processor available on globalThis');
  console.log('Registry stats:', getRegistryStats());
}