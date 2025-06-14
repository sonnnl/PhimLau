import { useState, useEffect, useCallback } from "react";

const useWatchState = (slug, movieDetails) => {
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(null);

  // Load saved watch state
  const loadWatchState = useCallback(() => {
    if (!slug || !movieDetails?.episodes?.length) return;

    let lastState = null;
    try {
      const storedState = localStorage.getItem(
        `myMovieApp_watch_state_${slug}`
      );
      if (storedState) {
        lastState = JSON.parse(storedState);
      }
    } catch (e) {
      console.error("Error reading watch state from localStorage:", e);
      localStorage.removeItem(`myMovieApp_watch_state_${slug}`);
    }

    // Set initial server and episode
    let serverToSelect = 0;
    let episodeToSelect = null;

    // Use stored state if available
    if (
      lastState &&
      lastState.serverIndex !== undefined &&
      movieDetails.episodes[lastState.serverIndex]
    ) {
      serverToSelect = lastState.serverIndex;
    }

    const selectedServerData =
      movieDetails.episodes[serverToSelect]?.server_data;

    if (selectedServerData && selectedServerData.length > 0) {
      episodeToSelect = selectedServerData[0];

      if (lastState && lastState.episodeSlug) {
        const foundEpisode = selectedServerData.find(
          (ep) => ep.slug === lastState.episodeSlug
        );
        if (foundEpisode) {
          episodeToSelect = foundEpisode;
        }
      }
    }

    setSelectedServerIndex(serverToSelect);
    setCurrentEpisode(episodeToSelect);
  }, [slug, movieDetails]);

  // Save watch state
  const saveWatchState = useCallback(() => {
    if (!slug || !movieDetails || !currentEpisode) return;

    try {
      const stateToSave = {
        slug,
        serverIndex: selectedServerIndex,
        episodeSlug: currentEpisode.slug,
        episodeName: currentEpisode.name,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `myMovieApp_watch_state_${slug}`,
        JSON.stringify(stateToSave)
      );
    } catch (e) {
      console.error("Error saving watch state to localStorage:", e);
    }
  }, [slug, movieDetails, currentEpisode, selectedServerIndex]);

  // Handle server change
  const handleServerChange = useCallback(
    (event) => {
      const newServerIndex = parseInt(event.target.value, 10);
      const newServerData = movieDetails?.episodes[newServerIndex]?.server_data;
      let newEpisode = null;

      if (newServerData && newServerData.length > 0) {
        newEpisode = newServerData[0];
      }

      setSelectedServerIndex(newServerIndex);
      setCurrentEpisode(newEpisode);
    },
    [movieDetails]
  );

  // Handle episode selection
  const handleEpisodeSelect = useCallback((episode) => {
    setCurrentEpisode(episode);
  }, []);

  useEffect(() => {
    loadWatchState();
  }, [loadWatchState]);

  useEffect(() => {
    saveWatchState();
  }, [saveWatchState]);

  return {
    selectedServerIndex,
    currentEpisode,
    handleServerChange,
    handleEpisodeSelect,
  };
};

export default useWatchState;
