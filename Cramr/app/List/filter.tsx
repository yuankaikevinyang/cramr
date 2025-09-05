import Slider from '@react-native-community/slider';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import { Button } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

export type Filters = {
  distance: number;
  unit: 'mi' | 'km';
  attendees: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (filters: Filters) => void;
};

export default function FilterModal({ visible, onClose, onSave }: Props) {
  // Colors
  const { isDarkMode } = useUser();
  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const textInputColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const placeholderTextColor = !isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText;

  const [step, setStep] = useState(0);
  const [distance, setDistance] = useState(1);
  const [unit, setUnit] = useState<'mi' | 'km'>('mi');
  const [attendees, setAttendees] = useState(2);

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const reset = () => {
    setDistance(1);
    setUnit('mi');
    setAttendees(2);
    setStep(0);
    onSave({ distance: 0, unit: 'mi', attendees: 0 });
    onClose();
  };

  const handleSave = () => {
    onSave({ distance, unit, attendees });
    onClose();
    setStep(0);
  };

  function nextOrSave() {
    if (step < 2) next();
    else handleSave();
  }

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={{ justifyContent: 'center', margin: 0 }}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={[styles.modal, { backgroundColor }]}>
        <Text style={[styles.header, { color: textColor }]}>Filter by</Text>
        <View style={styles.content}>
          {step === 0 && (
            <>
              <Pressable style={[styles.inputBox, { backgroundColor: textInputColor }]} onPress={() => setStep(1)}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Distance</Text>
                <Text style={[styles.inputValue, { color: textColor }]}>
                  {distance} {unit}
                </Text>
              </Pressable>
              <Pressable style={[styles.inputBox, { backgroundColor: textInputColor }]} onPress={() => setStep(2)}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Number of Attendees</Text>
                <Text style={[styles.inputValue, { color: textColor }]}>{attendees} people</Text>
              </Pressable>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={[styles.inputLabel, { color: textColor }]}>Distance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <Button
                  mode={unit === 'mi' ? 'outlined' : 'contained'}
                  onPress={() => setUnit('mi')}
                  style={{ backgroundColor: textInputColor }}
                  theme={{
                    colors: {
                      outline: textColor,
                      onSurface: textColor,
                    },
                  }}
                >
                  <Text style={{ color: textColor, fontFamily: 'Poppins-Regular', fontSize: 14 }}>Mi</Text>
                </Button>
                <Button
                  mode={unit === 'km' ? 'outlined' : 'contained'}
                  onPress={() => setUnit('km')}
                  style={{ marginLeft: 8, backgroundColor: textInputColor }}
                  theme={{
                    colors: {
                      outline: textColor,
                      onSurface: textColor,
                    },
                  }}
                >
                  <Text style={{ color: textColor, fontFamily: 'Poppins-Regular', fontSize: 14 }}>Km</Text>
                </Button>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor={textColor}
                maximumTrackTintColor={placeholderTextColor}
              />
              <Text
                style={{
                  alignSelf: 'center',
                  marginBottom: 24,
                  fontSize: 14,
                  fontFamily: 'Poppins-Regular',
                  color: textColor,
                }}
              >
                {`> ${distance} ${unit}`}
              </Text>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[styles.inputLabel, { color: textColor }]}>Number of Attendees</Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={attendees}
                onValueChange={setAttendees}
                minimumTrackTintColor={textColor}
                maximumTrackTintColor="#eee"
              />
              <Text
                style={{
                  alignSelf: 'center',
                  marginBottom: 24,
                  color: textColor,
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                }}
              >
                {`> ${attendees} People`}
              </Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable style={[styles.footerBtn, { backgroundColor: '#f37b7b' }]} onPress={reset}>
            <Text style={{ color: textColor, fontFamily: 'Poppins-Regular', fontSize: 16 }}>Reset</Text>
          </Pressable>
          <Pressable
            style={[styles.footerBtn, { backgroundColor: '#5caef1' }]}
            onPress={step === 0 ? handleSave : nextOrSave}
          >
            <Text style={{ color: textColor, fontFamily: 'Poppins-Regular', fontSize: 16 }}>
              {step === 0 ? 'Save' : 'Next'}
            </Text>
          </Pressable>
        </View>

        {step > 0 && (
          <Pressable onPress={() => setStep(0)} style={styles.backBtn} accessibilityLabel="Back to main filter menu">
            <ArrowLeft size={24} color={textColor} style={{ marginTop: -5 }} />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    borderRadius: 18,
    padding: 20,
    margin: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    minHeight: 300,
    justifyContent: 'flex-start',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 18,
    alignSelf: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    marginTop: 5,
    marginBottom: 10,
  },
  inputBox: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  inputValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  backBtn: {
    position: 'absolute',
    left: 14,
    top: 20,
    padding: 5,
    zIndex: 1,
  },
});
