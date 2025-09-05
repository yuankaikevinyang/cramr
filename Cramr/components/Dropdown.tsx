import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface DropdownOption {
    label: string;
    value: string;
}

interface DropdownProps {
    options: DropdownOption[];
    onSelect?: (value: string) => void;
    style?: object;
    option1: string | null;
    onChangeOption1: (value: string) => void;
    option1Answer: string | null;
    onChangeOption1Answer: (value: string) => void;
    option2: string | null;
    onChangeOption2: (value: string) => void;
    option2Answer: string | null;
    onChangeOption2Answer: (value: string) => void;
    option3: string | null;
    onChangeOption3: (value: string) => void;
    option3Answer: string | null;
    onChangeOption3Answer: (value: string) => void;
    isDarkMode: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ 
    options,
    onSelect,
    style = {marginLeft: 20, marginRight: 20},
    option1,
    onChangeOption1,
    option1Answer,
    onChangeOption1Answer,
    option2,
    onChangeOption2,
    option2Answer,
    onChangeOption2Answer,
    option3,
    onChangeOption3,
    option3Answer,
    onChangeOption3Answer,
    isDarkMode,
}) => {
    const dropdownColor = (!isDarkMode ? Colors.light.dropdown : Colors.dark.dropdown)
    const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
    const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)

    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Get available options (exclude already selected ones)
    const getAvailableOptions = () => {
        const selectedLabels = [option1, option2, option3].filter(Boolean);
        return options.filter(option => !selectedLabels.includes(option.label));
    };

    const handleSelect = (option: DropdownOption): void => {
        // Find the first empty slot and assign the selected option
        if (!option1) {
            onChangeOption1(option.label);  // Save the actual prompt text
        } else if (!option2) {
            onChangeOption2(option.label);  // Save the actual prompt text
        } else if (!option3) {
            onChangeOption3(option.label);  // Save the actual prompt text
        }
        
        setIsOpen(false);
    };

    const handleDelete = (optionNumber: 1 | 2 | 3): void => {
        switch (optionNumber) {
            case 1:
                onChangeOption1('');
                onChangeOption1Answer('');
                break;
            case 2:
                onChangeOption2('');
                onChangeOption2Answer('');
                break;
            case 3:
                onChangeOption3('');
                onChangeOption3Answer('');
                break;
        }
    };

    const getOptionLabel = (label: string) => {
        // Since we're now storing labels directly, just return the label
        return label;
    };

    const availableOptions = getAvailableOptions();
    const hasAvailableSlots = !option1 || !option2 || !option3;

    return (
        <View style={styles.container}>
            {/* Only show dropdown if there are available slots and options */}
            {hasAvailableSlots && availableOptions.length > 0 && (
                <>
                    <TouchableOpacity
                        style={[styles.grayBar, { backgroundColor: dropdownColor }]}
                        onPress={() => setIsOpen(!isOpen)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.bodyText, { color: textColor }]}>Add a prompt</Text>
                        <Image 
                            source={require('../assets/images/down_arrow.png')} 
                            style={[styles.icon, { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }]} 
                        />
                    </TouchableOpacity>

                    {isOpen && (
                        <View style={[styles.menu, { backgroundColor: textInputColor }]}>
                            {availableOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.option,
                                        index === availableOptions.length - 1 && styles.lastOption
                                    ]}
                                    onPress={() => handleSelect(option)}
                                >
                                    <Text style={[styles.bodyText, { color: textColor }]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </>
            )}

            {/* Render Option 1 */}
            {option1 && (
                <View style={{ marginTop: 10 }}>
                    <View style={[styles.selectedContainer, { backgroundColor: textInputColor }]}>
                        <Text style={[styles.bodyText, { color: textColor }]}>{getOptionLabel(option1)}</Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(1)}
                        >
                            <Text style={styles.deleteText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.bodyText, styles.largeTextInputContainer, { backgroundColor: textInputColor, marginTop: 1, color: textColor}]}
                        placeholder="Enter answer to prompt."
                        value={option1Answer || ''}
                        onChangeText={onChangeOption1Answer}
                        textAlign="left"
                        textAlignVertical="top"
                        maxLength={100}
                        multiline={true}
                    />
                </View>
            )}

            {/* Render Option 2 */}
            {option2 && (
                <View style={{ marginTop: 10 }}>
                    <View style={[styles.selectedContainer, { backgroundColor: textInputColor }]}>
                        <Text style={[styles.bodyText, { color: textColor }]}>{getOptionLabel(option2)}</Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(2)}
                        >
                            <Text style={styles.deleteText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.bodyText, styles.largeTextInputContainer, { backgroundColor: textInputColor, marginTop: 1,  color: textColor }]}
                        placeholder="Enter answer to prompt."
                        value={option2Answer || ''}
                        onChangeText={onChangeOption2Answer}
                        textAlign="left"
                        textAlignVertical="top"
                        maxLength={100}
                        multiline={true}
                    />
                </View>
            )}

            {/* Render Option 3 */}
            {option3 && (
                <View style={{ marginTop: 10 }}>
                    <View style={[styles.selectedContainer, { backgroundColor: textInputColor }]}>
                        <Text style={[styles.bodyText, { color: textColor }]}>{getOptionLabel(option3)}</Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(3)}
                        >
                            <Text style={styles.deleteText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.bodyText, styles.largeTextInputContainer, { backgroundColor: textInputColor, marginTop: 1,  color: textColor}]}
                        placeholder="Enter answer to prompt."
                        value={option3Answer || ''}
                        onChangeText={onChangeOption3Answer}
                        textAlign="left"
                        textAlignVertical="top"
                        maxLength={100}
                        multiline={true}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    bodyText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
    },
    container: {
        position: 'relative',
    },
    grayBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
    },
    selectedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        position: 'relative',
    },
    icon: {
        width: 20,
        height: 20,
    },
    menu: {
        borderRadius: 10,
        marginTop: 5,
    },
    option: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    lastOption: {
        borderBottomWidth: 0,
    },
    largeTextInputContainer: {
        width: '100%',
        height: 80,
        borderRadius: 10,
        padding: 10,
    },
    deleteButton: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    deleteText: {
        fontSize: 14,
        color: '#E36062',
        fontWeight: 'bold',
    },
});

export default Dropdown;