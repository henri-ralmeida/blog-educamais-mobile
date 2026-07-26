import { Alert, Platform } from 'react-native';

// Alert.alert é um no-op no react-native-web (a implementação é um método vazio),
// então confirmação de exclusão, confirmação de saída e avisos de erro
// simplesmente não aconteciam no alvo web — o toque não produzia efeito nenhum
// e nenhum erro aparecia no console. Aqui a web usa os diálogos nativos do
// navegador e o mobile continua com o Alert nativo.

export function confirmDestructiveAction({
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
}) {
  if (Platform.OS === 'web') {
    const confirmFn = globalThis.confirm;
    if (typeof confirmFn !== 'function') return Promise.resolve(false);
    return Promise.resolve(confirmFn(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title, message) {
  const text = typeof message === 'string' && message.trim() ? message : title;
  if (Platform.OS === 'web') {
    const alertFn = globalThis.alert;
    if (typeof alertFn === 'function') alertFn(`${title}\n\n${text}`);
    return;
  }
  Alert.alert(title, text);
}
