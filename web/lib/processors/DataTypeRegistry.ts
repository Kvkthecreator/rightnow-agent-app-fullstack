/**
 * Data Type Registry
 * 
 * Central registry for all data type processors. Provides discovery,
 * registration, and management of processors in a modular way.
 */

import { DataTypeIdentifier } from './types';
import type {
  DataTypeProcessor,
  ProcessingCapability
} from './types';

export class DataTypeRegistry {
  private processors = new Map<DataTypeIdentifier, DataTypeProcessor>();
  
  /**
   * Register a new data type processor
   */
  register<T>(processor: DataTypeProcessor<T>): void {
    if (this.processors.has(processor.type)) {
      console.warn(`Processor for type ${processor.type} is being replaced`);
    }
    
    this.processors.set(processor.type, processor);
    console.log(`Registered processor: ${processor.type} with capabilities:`, 
                processor.processingCapabilities.map(cap => cap.name));
  }
  
  /**
   * Get a specific processor by type
   */
  getProcessor(type: DataTypeIdentifier): DataTypeProcessor | undefined {
    return this.processors.get(type);
  }
  
  /**
   * Find the appropriate processor for given input
   */
  findProcessorForInput(input: unknown): DataTypeProcessor | undefined {
    // Try each processor until one can handle the input
    for (const processor of this.processors.values()) {
      if (processor.canProcess(input)) {
        return processor;
      }
    }
    return undefined;
  }
  
  /**
   * Find all processors that can handle the given input
   */
  findAllProcessorsForInput(input: unknown): DataTypeProcessor[] {
    const compatibleProcessors = [];
    for (const processor of this.processors.values()) {
      if (processor.canProcess(input)) {
        compatibleProcessors.push(processor);
      }
    }
    return compatibleProcessors;
  }
  
  /**
   * Get all registered processor types
   */
  getSupportedTypes(): DataTypeIdentifier[] {
    return Array.from(this.processors.keys());
  }
  
  /**
   * Get processing capabilities for all registered processors
   */
  getProcessingCapabilities(): Map<DataTypeIdentifier, ProcessingCapability[]> {
    const capabilities = new Map();
    for (const [type, processor] of this.processors) {
      capabilities.set(type, processor.processingCapabilities);
    }
    return capabilities;
  }
  
  /**
   * Get detailed information about all processors
   */
  getProcessorInfo(): Array<{
    type: DataTypeIdentifier;
    supportedFormats: string[];
    capabilities: ProcessingCapability[];
    metadata: any;
  }> {
    const info = [];
    for (const processor of this.processors.values()) {
      info.push({
        type: processor.type,
        supportedFormats: processor.supportedFormats,
        capabilities: processor.processingCapabilities,
        metadata: processor.getProcessingInfo()
      });
    }
    return info;
  }
  
  /**
   * Check if a specific data type is supported
   */
  isTypeSupported(type: DataTypeIdentifier): boolean {
    return this.processors.has(type);
  }
  
  /**
   * Check if input can be processed by any registered processor
   */
  canProcessInput(input: unknown): boolean {
    return this.findProcessorForInput(input) !== undefined;
  }
  
  /**
   * Get statistics about registered processors
   */
  getRegistryStats(): {
    totalProcessors: number;
    supportedTypes: DataTypeIdentifier[];
    totalCapabilities: number;
    avgCapabilitiesPerProcessor: number;
  } {
    const capabilities = this.getProcessingCapabilities();
    const totalCapabilities = Array.from(capabilities.values())
      .reduce((sum, caps) => sum + caps.length, 0);
    
    return {
      totalProcessors: this.processors.size,
      supportedTypes: this.getSupportedTypes(),
      totalCapabilities,
      avgCapabilitiesPerProcessor: totalCapabilities / this.processors.size || 0
    };
  }
  
  /**
   * Remove a processor (useful for testing or dynamic updates)
   */
  unregister(type: DataTypeIdentifier): boolean {
    const existed = this.processors.has(type);
    this.processors.delete(type);
    if (existed) {
      console.log(`Unregistered processor: ${type}`);
    }
    return existed;
  }
  
  /**
   * Clear all processors (useful for testing)
   */
  clear(): void {
    const count = this.processors.size;
    this.processors.clear();
    console.log(`Cleared ${count} processors from registry`);
  }
}