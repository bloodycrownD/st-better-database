<template>
  <div class="auto-resize-wrapper" :class="{ focused: isFocused, disabled: disabled }">
    <div ref="mirrorRef" class="textarea-mirror" aria-hidden="true"></div>

    <textarea
        ref="textareaRef"
        class="auto-resize-textarea"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :rows="1"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
    />
    <div class="textarea-footer" v-if="showCount && maxlength">
      <span class="char-count" :class="{ warning: charCount > maxlength * 0.9 }">
        {{ charCount }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';

const props = withDefaults(
    defineProps<{
      modelValue?: string;
      placeholder?: string;
      minRows?: number;
      maxRows?: number;
      disabled?: boolean;
      readonly?: boolean;
      maxlength?: number;
      showCount?: boolean;
      submitOnEnter?: boolean;
    }>(),
    {
      modelValue: '',
      placeholder: '请输入内容...',
      minRows: 1,
      maxRows: 15,
      disabled: false,
      readonly: false,
      maxlength: undefined,
      showCount: false,
      submitOnEnter: false
    }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  focus: [e: FocusEvent];
  blur: [e: FocusEvent];
  submit: [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const mirrorRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(false);
const lineHeight = ref(24);

const charCount = computed(() => (props.modelValue || '').length);

function adjustHeight() {
  const textarea = textareaRef.value;
  const mirror = mirrorRef.value;
  if (!textarea || !mirror) return;

  const cs = window.getComputedStyle(textarea);
  const lh = parseFloat(cs.lineHeight) || 24;
  lineHeight.value = lh;

  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  const bt = parseFloat(cs.borderTopWidth) || 0;
  const bb = parseFloat(cs.borderBottomWidth) || 0;

  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.fontSize = cs.fontSize;
  mirror.style.fontFamily = cs.fontFamily;
  mirror.style.fontWeight = cs.fontWeight;
  mirror.style.letterSpacing = cs.letterSpacing;
  mirror.style.wordSpacing = cs.wordSpacing;
  mirror.style.lineHeight = cs.lineHeight;
  mirror.style.paddingTop = cs.paddingTop;
  mirror.style.paddingBottom = cs.paddingBottom;
  mirror.style.paddingLeft = cs.paddingLeft;
  mirror.style.paddingRight = cs.paddingRight;
  mirror.style.wordBreak = cs.wordBreak;
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.boxSizing = 'border-box';

  const value = props.modelValue || '';
  mirror.textContent = value + '\n';

  const contentHeight = mirror.scrollHeight;
  const minHeight = lh * props.minRows + pt + pb;
  const maxHeight = lh * props.maxRows + pt + pb;

  const targetHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);

  textarea.style.height = `${targetHeight + bt + bb}px`;
  textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
}

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  adjustHeight();
  nextTick(adjustHeight);
}

function handleFocus(e: FocusEvent) {
  isFocused.value = true;
  emit('focus', e);
}

function handleBlur(e: FocusEvent) {
  isFocused.value = false;
  emit('blur', e);
}

function handleKeydown(e: KeyboardEvent) {
  if (props.submitOnEnter && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    emit('submit', props.modelValue || '');
  }
}

function focus() {
  textareaRef.value?.focus();
}

function blur() {
  textareaRef.value?.blur();
}

defineExpose({focus, blur, adjustHeight});

watch(() => props.modelValue, () => {
  nextTick(adjustHeight);
});

watch([() => props.minRows, () => props.maxRows], () => {
  nextTick(adjustHeight);
});

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  adjustHeight();

  if (window.ResizeObserver && textareaRef.value) {
    resizeObserver = new ResizeObserver(() => adjustHeight());
    resizeObserver.observe(textareaRef.value.parentElement!);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped lang="less">
.auto-resize-wrapper {
  position: relative;
  width: 100%;
  border: 1.5px solid var(--SmartThemeBorderColor);
  border-radius: 8px;
  background: var(--SmartThemeBlurTintColor);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(.disabled) {
    border-color: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
  }

  &.focused {
    border-color: var(--SmartThemeEmColor);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--SmartThemeEmColor) 20%, transparent);
    background: var(--SmartThemeBlurTintColor);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.textarea-mirror {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
  height: auto;
  overflow: hidden;
  z-index: -1;
}

.auto-resize-textarea {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--SmartThemeBodyColor);
  resize: none;
  overflow: hidden;
  box-sizing: border-box;
  transition: height 0.15s ease;

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 40%, transparent);
    font-size: 13px;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 60%, transparent);
    border-radius: 4px;

    &:hover {
      background: color-mix(in srgb, var(--SmartThemeBorderColor) 80%, transparent);
    }
  }
}

.textarea-footer {
  display: flex;
  justify-content: flex-end;
  padding: 2px 14px 8px;
  margin-top: -4px;
}

.char-count {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 45%, transparent);
  transition: color 0.2s;

  &.warning {
    color: #ef4444;
    font-weight: 600;
  }
}

@media (max-width: 768px) {
  .auto-resize-textarea {
    padding: 14px 16px;
    font-size: 16px;
  }
}
</style>
