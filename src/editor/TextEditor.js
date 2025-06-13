import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import htmlDocx from 'html-docx-js/dist/html-docx';
import * as mammoth from 'mammoth';
import "./TextEditor.css";
import "../App.css";

export default function TextEditor ({
  apiKey = 'YOUR TINYMCE_API_KEY',
  initialContent = '',
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle file opening
  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  // Process selected file
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setCurrentFileName(file.name);

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let content = '';

      switch (fileExtension) {
        case 'docx':
          content = await readDocxFile(file);
          break;
        case 'doc':
          content = await readDocFile(file);
          break;
        case 'txt':
          content = await readTextFile(file);
          break;
        case 'html':
        case 'htm':
          content = await readHtmlFile(file);
          break;
        case 'rtf':
          content = await readRtfFile(file);
          break;
        default:
          // Try to read as plain text
          content = await readTextFile(file);
      }

      // Set content in editor
      if (editorRef.current) {
        editorRef.current.setContent(content);
      }

    } catch (error) {
      console.error('Error reading file:', error);
      alert(`Error opening file: ${error.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Read DOCX files using mammoth
  const readDocxFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to read DOCX file. Please ensure it\'s a valid document.');
    }
  };

  // Read DOC files (legacy format)
  const readDocFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    } catch (error) {
      // Fallback: try to read as text
      return await readTextFile(file);
    }
  };

  // Read plain text files
  const readTextFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Convert plain text to HTML with line breaks
        const htmlContent = text.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
        resolve(htmlContent);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Read HTML files
  const readHtmlFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let html = e.target.result;
        
        // Extract body content if it's a complete HTML document
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          html = bodyMatch[1];
        }
        
        // Remove script tags for security
        html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
        
        resolve(html);
      };
      reader.onerror = () => reject(new Error('Failed to read HTML file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Read RTF files (basic conversion)
  const readRtfFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let rtfContent = e.target.result;
        
        // Basic RTF to HTML conversion (simplified)
        // This is a basic implementation - for production use a proper RTF parser
        rtfContent = rtfContent.replace(/\\par\s*/g, '<br>');
        rtfContent = rtfContent.replace(/\\b\s*(.*?)\\b0/g, '<strong>$1</strong>');
        rtfContent = rtfContent.replace(/\\i\s*(.*?)\\i0/g, '<em>$1</em>');
        rtfContent = rtfContent.replace(/\\ul\s*(.*?)\\ul0/g, '<u>$1</u>');
        
        // Remove RTF control codes
        rtfContent = rtfContent.replace(/\\[a-z]+\d*/g, '');
        rtfContent = rtfContent.replace(/[{}]/g, '');
        
        resolve(rtfContent);
      };
      reader.onerror = () => reject(new Error('Failed to read RTF file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Handle DOCX download
  const handleDownloadDocx = (e) => {
    e.preventDefault();
    const content = editorRef.current?.getContent() || '';
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>${content}</body>
      </html>
    `;
    const blob = htmlDocx.asBlob(html, { orientation: 'portrait' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = currentFileName ? 
      currentFileName.replace(/\.[^/.]+$/, '.docx') : 
      'document.docx';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Handle new document
  const handleNewDocument = () => {
    if (editorRef.current) {
      const hasContent = editorRef.current.getContent().trim() !== '';
      if (hasContent && !window.confirm('Are you sure you want to create a new document? Unsaved changes will be lost.')) {
        return;
      }
      editorRef.current.setContent('');
      setCurrentFileName('');
    }
  };

  // Handle save as HTML
  const handleSaveAsHtml = () => {
    const content = editorRef.current?.getContent() || '';
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = currentFileName ? 
      currentFileName.replace(/\.[^/.]+$/, '.html') : 
      'document.html';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Handle save as plain text
  const handleSaveAsText = () => {
    const content = editorRef.current?.getContent() || '';
    // Convert HTML to plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = currentFileName ? 
      currentFileName.replace(/\.[^/.]+$/, '.txt') : 
      'document.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="main-content">
      <h2 className="header-title mb-4">📝 Rich Text Editor</h2>
      
      {currentFileName && (
        <div className="current-file-indicator">
          📄 Current file: <strong>{currentFileName}</strong>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          ⏳ Loading file...
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".txt,.html,.htm,.docx,.doc,.rtf"
        style={{ display: 'none' }}
      />

      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button 
            type="button" 
            className="toolbar-button-new-open"
            onClick={handleNewDocument}
            title="New Document"
          >
            📄 New
          </button>
          <button 
            type="button" 
            className="toolbar-button-new-open"
            onClick={handleFileOpen}
            title="Open File"
          >
            📁 Open
          </button>
        </div>
        
        <div className="toolbar-group">
          <button 
            type="button" 
            className="toolbar-button-save"
            onClick={handleDownloadDocx}
            title="Save as DOCX"
          >
            💾 Save DOCX
          </button>
          <button 
            type="button" 
            className="toolbar-button-save"
            onClick={handleSaveAsHtml}
            title="Save as HTML"
          >
            🌐 Save HTML
          </button>
          <button 
            type="button" 
            className="toolbar-button-save"
            onClick={handleSaveAsText}
            title="Save as Text"
          >
            📝 Save TXT
          </button>
        </div>
      </div>

      <form className="edit-form">
        <Editor
          id="editor"
          apiKey={apiKey}
          onInit={(evt, editor) => (editorRef.current = editor)}
          initialValue={initialContent}
          init={{
            height: 700,
            menubar: true,
            plugins: [
              'advlist',
              'autolink',
              'lists',
              'link',
              'image',
              'charmap',
              'preview',
              'anchor',
              'searchreplace',
              'visualblocks',
              'code',
              'fullscreen',
              'insertdatetime',
              'media',
              'table',
              'code',
              'help',
              'wordcount',
              'emoticons',
            ],
            toolbar:
              'undo redo | styleselect | ' +
              'bold italic underline strikethrough | forecolor backcolor | ' +
              'alignleft aligncenter alignright alignjustify | ' +
              'bullist numlist outdent indent | ' +
              'link image media table emoticons charmap | ' +
              'code fullscreen preview | searchreplace | help',
            content_style:
              'body { font-family: Arial; font-size: 10pt; line-height: 1.4; }',
            paste_data_images: true,
            automatic_uploads: false,
            file_picker_types: 'image',
            branding: false,
          }}
        />
      </form>
    </div>
  );
};

