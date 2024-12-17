import React, { useState } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './SectionManager.css';

function SectionManager({ sections, onSectionsUpdate }) {
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      toast.error('Section name cannot be empty');
      return;
    }

    try {
      const name = newSectionName.trim();
      const sectionId = name
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/sections/add`, {
        sectionId,
        name
      });

      if (response.data.trackList) {
        onSectionsUpdate(response.data.trackList);
        setNewSectionName('');
        toast.success('Section added successfully');
      }
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error(error.response?.data?.error || 'Failed to add section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? All tracks must be moved first.')) {
      return;
    }

    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/sections/${sectionId}`);
      if (response.data.trackList) {
        onSectionsUpdate(response.data.trackList);
        toast.success('Section deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error.response?.data?.error || 'Failed to delete section');
    }
  };

  const handleRenameSection = async (sectionId) => {
    if (!editingName.trim()) {
      toast.error('Section name cannot be empty');
      return;
    }

    try {
      const newId = editingName.trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/sections/${sectionId}/rename`, {
        newId
      });

      if (response.data.trackList) {
        onSectionsUpdate(response.data.trackList);
        setEditingSectionId(null);
        setEditingName('');
        toast.success('Section renamed successfully');
      }
    } catch (error) {
      console.error('Error renaming section:', error);
      toast.error(error.response?.data?.error || 'Failed to rename section');
    }
  };

  const handleToggleVisibility = async (sectionId, currentlyHidden) => {
    console.log('=== Toggle Section Visibility ===');
    console.log('Section ID:', sectionId);
    console.log('Currently Hidden:', currentlyHidden);
    
    try {
      console.log('Sending request to:', `${process.env.REACT_APP_API_URL}/sections/${sectionId}/visibility`);
      console.log('Request payload:', { hidden: !currentlyHidden });
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/sections/${sectionId}/visibility`,
        { hidden: !currentlyHidden }
      );

      console.log('Server response:', response.data);
      
      if (response.data.trackList) {
        console.log('Updating sections with new track list');
        onSectionsUpdate(response.data.trackList);
        toast.success(`Section ${!currentlyHidden ? 'hidden' : 'shown'} successfully`);
      } else {
        console.warn('No trackList in response:', response.data);
      }
    } catch (error) {
      console.error('Error toggling section visibility:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to update section visibility');
    }
  };

  const handleMoveSection = async (sectionId, direction) => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newOrder = [...sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sections.length) return;

    // Swap sections
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/sections/${sectionId}/reorder`,
        { newOrder: newOrder.map(s => s.id) }
      );

      if (response.data.trackList) {
        onSectionsUpdate(response.data.trackList);
        toast.success('Section order updated successfully');
      }
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast.error('Failed to reorder sections');
    }
  };

  return (
    <div className="section-manager">
      <h3>Manage Sections</h3>
      
      <div className="add-section">
        <input
          type="text"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          placeholder="New section name"
          className="section-input"
        />
        <button onClick={handleAddSection} className="add-button">Add Section</button>
      </div>

      <div className="section-list">
        {sections.map((section, index) => (
          <div key={section.id} className="section-item">
            {editingSectionId === section.id ? (
              <div className="section-edit">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="section-input"
                />
                <button 
                  onClick={() => handleRenameSection(section.id)}
                  className="save-button"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setEditingSectionId(null);
                    setEditingName('');
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="section-controls">
                <span className="section-name">{section.name}</span>
                <div className="section-buttons">
                  <button
                    onClick={() => handleMoveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="move-button"
                    title="Move up"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    onClick={() => handleMoveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className="move-button"
                    title="Move down"
                  >
                    <FaArrowDown />
                  </button>
                  <button
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setEditingName(section.name);
                    }}
                    className="edit-button"
                    title="Rename section"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(section.id, section.hidden)}
                    className="visibility-button"
                    title={section.hidden ? 'Show section' : 'Hide section'}
                  >
                    {section.hidden ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="delete-button"
                    title="Delete section"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SectionManager; 