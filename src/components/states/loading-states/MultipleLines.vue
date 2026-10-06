<template>
  <div class="mb-7">
    <div
      class="xs:w-10 md:w-6 h-3 mx-5 mt-5 rounded bg-gray-200 dark:bg-gray-600 panimate-pulse"
    ></div>

    <div v-for="_idx in 2" :key="_idx" class="mx-5 my-6 flex justify-between">
      <div
        class="xs:w-full md:w-13 h-3 rounded bg-gray-200 dark:bg-gray-600 animate-pulse"
      ></div>
    </div>
  </div>
</template>
