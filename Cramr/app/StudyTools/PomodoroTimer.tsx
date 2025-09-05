import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  work: number; // 25 minutes in seconds
  shortBreak: number; // 5 minutes in seconds
  longBreak: number; // 15 minutes in seconds
}

interface Task {
  id: string;
  text: string;
}

export default function PomodoroTimer() {
  const router = useRouter();
  const { isDarkMode } = useUser();
  
  // Colors
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);
  const buttonColor = Colors.button;

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentGif, setCurrentGif] = useState<'catboat' | 'icey'>(() => 
    Math.random() < 0.5 ? 'catboat' : 'icey'
  );

  // Timer settings
  const timerSettings: TimerSettings = {
    work: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer title based on current mode
  const getTimerTitle = (): string => {
    switch (currentMode) {
      case 'work':
        return 'Pomodoro';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Pomodoro';
    }
  };

  // Start timer
  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  // Pause timer
  const pauseTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(timerSettings[currentMode]);
    // Also randomize GIF on reset for more variety
    const randomGif = Math.random() < 0.5 ? 'catboat' : 'icey';
    console.log('Random GIF on reset:', randomGif);
    setCurrentGif(randomGif);
  };

  // Switch to next timer mode
  const switchToNextMode = () => {
    if (currentMode === 'work') {
      const newSessions = completedSessions + 1;
      setCompletedSessions(newSessions);
      
      // Every 4 work sessions, take a long break
      if (newSessions % 4 === 0) {
        setCurrentMode('longBreak');
        setTimeLeft(timerSettings.longBreak);
      } else {
        setCurrentMode('shortBreak');
        setTimeLeft(timerSettings.shortBreak);
      }
    } else {
      setCurrentMode('work');
      setTimeLeft(timerSettings.work);
    }
  };

  // Add task
  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim()
      };
      setTasks([...tasks, newTask]);
      setNewTaskText('');
    }
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Timer finished
            Vibration.vibrate(1000); // Vibrate for 1 second
            Alert.alert(
              'Timer Complete!',
              `${getTimerTitle()} is finished!`,
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    switchToNextMode();
                    setIsRunning(false);
                  }
                }
              ]
            );
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, currentMode]);



  // Reset time when mode changes
  useEffect(() => {
    setTimeLeft(timerSettings[currentMode]);
  }, [currentMode]);

  const renderTask = ({ item }: { item: Task }) => (
    <View style={[styles.taskItem, { backgroundColor: textInputColor }]}>
      <Text style={[styles.taskText, { color: textColor }]}>{item.text}</Text>
      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <X size={20} color="#E36062" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{height: tasks.length > 0 ? 1000 + tasks.length * 80 : 1000 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: textColor }]}>Pomodoro Timer</Text>
          </View>

          {/* Mode Selection Pills */}
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modePill,
                {backgroundColor: textInputColor},
                { borderColor: currentMode === 'work' ? textColor : 'transparent' }
              ]}
              onPress={() => {
                setCurrentMode('work');
                setTimeLeft(timerSettings.work);
                setIsRunning(false);
              }}
            >
              <Text style={[styles.modePillText, { color: textColor }]}>Pomodoro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modePill,
                {backgroundColor: textInputColor},
                { borderColor: currentMode === 'shortBreak' ? textColor : 'transparent' }
              ]}
              onPress={() => {
                setCurrentMode('shortBreak');
                setTimeLeft(timerSettings.shortBreak);
                setIsRunning(false);
              }}
            >
              <Text style={[styles.modePillText, { color: textColor }]}>Short Break</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modePill,
                {backgroundColor: textInputColor},
                { borderColor: currentMode === 'longBreak' ? textColor : 'transparent' }
              ]}
              onPress={() => {
                setCurrentMode('longBreak');
                setTimeLeft(timerSettings.longBreak);
                setIsRunning(false);
              }}
            >
              <Text style={[styles.modePillText, { color: textColor }]}>Long Break</Text>
            </TouchableOpacity>
          </View>

          {/* Round Indicator */}
          <Text style={[styles.roundText, { color: textColor }]}>
            Round {completedSessions + 1}
          </Text>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Image 
              source={currentGif === 'catboat' 
                ? require('../../assets/images/catboat.gif')
                : require('../../assets/images/icey.gif')
              }
              style={[
                styles.gifAnimation,
                { opacity: isRunning ? 1 : 0.6 ,}
              ]}
              resizeMode="contain"
            />
            
            {/* GIF Credit - right below the GIF */}
            <Text style={[styles.gifCredit, { color: textColor }]}>
              {currentGif === 'catboat' 
                ? '🐱⛵ by Assma Amedi' 
                : '❄️ by Robin Griffiths'
              }
            </Text>
            
            <Text style={[styles.timer, { color: textColor }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetTimer}
            >
              <Text style={[styles.controlButtonText, { color: textColor }]}>Reset</Text>
            </TouchableOpacity>

            {!isRunning ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={startTimer}
              >
                <Text style={[styles.controlButtonText, { color: textColor }]}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.startButton}
                onPress={pauseTimer}
              >
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: textColor }]} />

          {/* Tasks Section */}
          <View style={styles.tasksContainer}>
            <Text style={[styles.tasksTitle, { color: textColor }]}>Tasks</Text>
            
            <FlatList
              data={tasks}
              renderItem={renderTask}
              keyExtractor={(item) => item.id}
              style={styles.tasksList}
              scrollEnabled={false}
            />

            {/* Add Task Input */}
            <View style={styles.addTaskContainer}>
              <TextInput
                style={[styles.taskInput, { backgroundColor: textInputColor, color: textColor }]}
                placeholder="Enter task.."
                placeholderTextColor={!isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText}
                value={newTaskText}
                onChangeText={setNewTaskText}
                onSubmitEditing={addTask}
              />
              <TouchableOpacity style={styles.addButton} onPress={addTask}>
                <Plus size={20} color={textColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 60,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modePill: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 36,
  },
  modePillText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Poppins-Regular',
  },
  roundText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginTop: 10
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gifAnimation: {
    width: 280,
    height: 280,
    alignSelf: 'center',
  },
  gifCredit: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  timerIcon: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
  },
  timer: {
    fontSize: 50,
    fontFamily: 'Poppins-SemiBold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#E36062',
    padding: 10,
    borderRadius: 10,
    width: 150,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#5CAEF1',
    padding: 10,
    borderRadius: 10,
    width: 150,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  tasksContainer: {
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginBottom: 15,
  },
  tasksList: {
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  addTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  addButton: {
    backgroundColor: '#5CAEF1',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
