import { library, config } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGrip, faList, faChevronRight, faChevronDown, faArrowUp, faLink, faXmark } from '@fortawesome/free-solid-svg-icons';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Prevent auto CSS injection since we're importing the CSS manually
config.autoAddCss = false;

// Add the icons you want to use
library.add(faGrip, faList, faChevronRight, faChevronDown, faArrowUp, faLink, faXmark);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon);
});
