import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface VTTextFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  maxLength?: number;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

const VTTextField: React.FC<VTTextFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  inputStyle,
  maxLength,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  rightIcon,
  onRightIconPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused, !!error && styles.labelError]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multiline && { height: numberOfLines * 24, textAlignVertical: 'top' },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholderGray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? Colors.ButtonPrimaryColor : '#64748B'}
            />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle"
            size={13}
            color={Colors.errorViewColor}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: '#334155',
    marginBottom: Spacing.xs,
  },
  labelFocused: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  labelError: {
    color: Colors.errorViewColor,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputFocused: {
    borderColor: Colors.ButtonPrimaryColor,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.errorViewColor,
    backgroundColor: '#FEF2F2',
  },
  inputDisabled: {
    backgroundColor: Colors.disabledGray,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.base,
    color: '#0F172A',
    paddingVertical: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.errorViewColor,
  },
});

export default VTTextField;

