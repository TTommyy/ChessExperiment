import { useState, useEffect } from 'react';
import { fetchExercises, createExercise, deleteExercise } from '../api/exercises';

const useExercises = () => {
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetchExercises();
        setExercises(response.data);
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    };
    loadExercises();
  }, []);

  const addExercise = async (exerciseData) => {
    try {
      const response = await createExercise(exerciseData);
      setExercises(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  };

  const removeExercise = async (id) => {
    try {
      await deleteExercise(id);
      setExercises(prev => prev.filter(ex => ex.id !== id));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  };

  return { exercises, addExercise, removeExercise };
};

export default useExercises;