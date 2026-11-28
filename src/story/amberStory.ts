import type {Line} from '../scenes/DialogueScene';
import type {Slide} from '../scenes/CutsceneScene';
export const AMBER_BEFORE:Line[]=[
 {who:'auri',mood:'worried',text:'Se eu deixar a fornalha apagar, de que servirá tudo que aprendi a construir?'},
 {who:'iris2',mood:'determined',text:'Seu valor não depende de quanto você consegue produzir. Até o fogo precisa de espaço para respirar.'},
 {who:'spark',mood:'talking',text:'Vamos ajudar essa criatura a encontrar seu próprio ritmo!'}
];
export const AMBER_AFTER:Line[]=[
 {who:'auri',mood:'grateful',text:'Passei tanto tempo alimentando o fogo que esqueci de cuidar de quem o mantinha aceso.'},
 {who:'iris2',mood:'happy',text:'Descansar não diminui a nossa luz.'}
];
export const AMBER_FINALE:Slide[]=[
 {tex:'cs_w9_outro',fit:'contain',text:'O Coração da Fornalha encontrou seu ritmo. As forjas voltaram a aquecer sem consumir tudo ao redor.'},
 {tex:'cs_w9_reward',fit:'contain',text:'Auri entregou a Íris a Memória do Equilíbrio. Criar, repousar e recomeçar fazem parte da mesma chama.'},
 {tex:'cs_w9_transition',fit:'contain',text:'Para além do calor de Âmbar, o Bosque de Ametista guardava luzes que ainda temiam ser vistas.'}
];
