import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import calendar from 'dayjs/plugin/calendar';

// Configurar plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(calendar);

// Configurar locale para pt-br
dayjs.locale('pt-br');

export default dayjs; 