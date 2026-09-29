import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface VTButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

const VTButton: React.FC<VTButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled) return '#E2E8F0';
    switch (variant) {
      case 'secondary': return '#F1F5F9';
      case 'outline':
      case 'ghost': return 'transparent';
      case 'danger': return Colors.errorViewColor;
      default: return Colors.ButtonPrimaryColor;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return Colors.disabledText;
    switch (variant) {
      case 'outline':
      case 'ghost': return Colors.ButtonPrimaryColor;
      case 'secondary': return Colors.TitleColor;
      default: return Colors.ButtonTextColor;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' || variant === 'ghost' ? 1.5 : (variant === 'secondary' ? 1 : 0),
          borderColor: variant === 'secondary' ? Colors.BorderColor : Colors.ButtonPrimaryColor,
        },
        variant === 'primary' && !isDisabled && styles.primaryShadow,
        variant === 'danger' && !isDisabled && styles.dangerShadow,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryShadow: {
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  dangerShadow: {
    shadowColor: Colors.errorViewColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});

export default VTButton;

