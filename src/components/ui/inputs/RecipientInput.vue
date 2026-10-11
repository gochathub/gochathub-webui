<script setup lang="ts">
// A one-row <textarea> styled like a text input. Password managers (Bitwarden,
// LastPass, 1Password) only attach to <input> elements, so a recipient address
// typed here is never offered the admin's own saved email. Enter submits the
// surrounding form; pasted line breaks are stripped.
const props = defineProps<{
  value?: string;
  label: string;
  name?: string;
  placeholder?: string;
}>();
const emit = defineEmits<{ valueChanged: [value: string] }>();

const onInput = (e: Event) => {
  const el = e.target as HTMLTextAreaElement;
  const clean = el.value.replace(/[\r\n]+/g, "");
  if (clean !== el.value) el.value = clean;
  emit("valueChanged", clean);
};
const submit = (e: KeyboardEvent) =>
  (e.target as HTMLTextAreaElement).form?.requestSubmit();
</script>

<template>
  <div class="flex flex-col">
    <label :for="props.name" class="body-2 text-muted mb-3">
      {{ props.label }}
    </label>
    <textarea
      :id="props.name"
      :name="props.name"
      rows="1"
      wrap="off"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      :placeholder="props.placeholder"
      :value="props.value"
      class="text-input ringed-input h-16! text-xl! resize-none overflow-hidden whitespace-nowrap"
      @input="onInput"
      @keydown.enter.prevent="submit"
    />
  </div>
</template>
