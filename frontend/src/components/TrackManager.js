import React, { useState, useEffect } from 'react';



import axios from 'axios';



import { FaPlay, FaCheck, FaClock, FaExclamation } from 'react-icons/fa';



import './TrackManager.css';







function TrackManager() {



  const [trackList, setTrackList] = useState(null);



  const [availableFiles, setAvailableFiles] = useState([]);



  const [selectedTrack, setSelectedTrack] = useState(null);



  const [editMode, setEditMode] = useState(false);



  const [error, setError] = useState(null);











  const fetchData = async () => {

    try {

      const [trackListRes, filesRes] = await Promise.all([

        axios.get(`${process.env.REACT_APP_API_URL}/track-list`),

        axios.get(`${process.env.REACT_APP_API_URL}/tracks`)

      ]);

      setTrackList(trackListRes.data);

      setAvailableFiles(filesRes.data);

    } catch (error) {

      console.error('Error fetching data:', error);

      setError('Failed to load data');

    }

  };







  useEffect(() => {

    fetchData();

  }, []);











  const getStatusIcon = (status) => {



    switch (status) {



      case 'ready':



        return <FaCheck className="status-icon ready" />;



      case 'planned':



        return <FaExclamation className="status-icon planned" />;



      default:



        return null;



    }



  };







  const handleAssignFile = async (trackId, filename) => {

    try {

      setError(null);

      console.log('Assigning file:', { trackId, filename });

      

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/assign-track`, {

        trackId,

        filename

      });

      

      console.log('Assignment response:', response.data);

      

      // Refresh the data

      await fetchData();

      

      // If the file was removed, deselect the track

      if (!filename) {

        setSelectedTrack(null);

      }

    } catch (error) {

      console.error('Error assigning file:', error);

      setError(error.response?.data?.error || 'Failed to assign file');

    }

  };







  const renderTrackSection = (title, tracks) => (



    <div className="track-section">



      <h3>{title}</h3>



      <div className="track-list">



        {tracks.map(track => (



          <div 



            key={track.id} 



            className={`track-item ${track.status} ${selectedTrack?.id === track.id ? 'selected' : ''}`}



            onClick={() => setSelectedTrack(track)}



          >



            <div className="track-info">



              {getStatusIcon(track.status)}



              <span className="track-title">{track.title}</span>



            </div>



            {track.filename && (



              <div className="track-file">



                <FaPlay className="play-icon" />



                <span className="filename">{track.filename}</span>



              </div>



            )}



          </div>



        ))}



      </div>



    </div>



  );







  return (



    <div className="track-manager">



      <div className="track-manager-header">



        <h2>Track Manager</h2>



        <button 



          className="edit-button"



          onClick={() => setEditMode(!editMode)}



        >



          {editMode ? 'Done' : 'Edit'}



        </button>



      </div>



      {error && (

        <div className="error-message">

          {error}

        </div>

      )}



      <div className="track-sections">



        {trackList && (



          <>



            {/* Score section */}
            {renderTrackSection('Score', trackList.score)}

            {/* Gnome Music section with separator */}
            <div className="track-section separator">
              {renderTrackSection('Gnome Music', trackList.gnomeMusic)}
            </div>

            {/* Outside Scope section with separator */}
            <div className="track-section separator">
              {renderTrackSection('Outside Current Scope', trackList.outsideScope)}
            </div>

          </>



        )}



      </div>



      {selectedTrack && editMode && (



        <div className="file-assignment">



          <h3>Assign File to "{selectedTrack.title}"</h3>



          <select 



            value={selectedTrack.filename || ''}



            onChange={(e) => handleAssignFile(selectedTrack.id, e.target.value)}



          >



            <option value="">-- Select a file --</option>



            {availableFiles.map(file => (



              <option key={file.filename} value={file.filename}>



                {file.filename}



              </option>



            ))}



          </select>



        </div>



      )}



    </div>



  );



}







export default TrackManager;








