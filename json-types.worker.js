import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';

self.addEventListener('message', async (event) => {
  const { id, json, language, rootName, rendererOptions, inference } = event.data || {};
  try {
    const jsonInput = jsonInputForTargetLanguage(language, undefined, false, rendererOptions || {});
    await jsonInput.addSource({ name: rootName, samples: [json] });
    const inputData = new InputData();
    inputData.addInput(jsonInput);
    const result = await quicktype({
      inputData,
      lang: language,
      rendererOptions: rendererOptions || {},
      allPropertiesOptional: Boolean(inference?.allPropertiesOptional),
      alphabetizeProperties: Boolean(inference?.alphabetizeProperties),
      inferDateTimes: inference?.inferDateTimes !== false,
      inferEnums: inference?.inferEnums !== false,
      inferMaps: inference?.inferMaps !== false,
      inferUuids: inference?.inferUuids !== false,
      inferIntegerStrings: Boolean(inference?.inferIntegerStrings),
      inferBooleanStrings: Boolean(inference?.inferBooleanStrings),
      combineClasses: true,
    });
    self.postMessage({ id, ok: true, code: result.lines.join('\n') });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
