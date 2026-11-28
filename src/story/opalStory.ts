import type {Line} from '../scenes/DialogueScene';
import type {Slide} from '../scenes/CutsceneScene';
export const OPAL_BEFORE:Line[]=[
 {who:'niva',mood:'worried',text:'Eu quis proteger tudo que amo. Mas, quando o medo tomou conta, até os caminhos deixaram de mudar.'},
 {who:'iris2',mood:'determined',text:'Cuidar também é deixar que a vida encontre novos caminhos.'},
 {who:'spark',mood:'talking',text:'Espere a rajada passar! Quando o núcleo se abrir, a luz do bastão poderá alcançá-lo.'}
];
export const OPAL_AFTER:Line[]=[
 {who:'niva',mood:'grateful',text:'Aprendi que mudar não significa perder quem somos.'},
 {who:'iris2',mood:'happy',text:'Podemos levar nossas memórias conosco, sem deixar que elas nos aprisionem.'}
];
export const OPAL_FINALE:Slide[]=[
 {tex:'cs_w8_outro',fit:'contain',text:'A Coroa da Geada deixou de temer a mudança. Sob os cristais de opala, a vida voltou a florescer.'},
 {tex:'cs_w8_reward',fit:'contain',text:'Niva entregou a Íris a Memória da Transformação. O gelo finalmente cedeu, e a vida encontrou um novo caminho.'},
 {tex:'cs_w8_transition',fit:'contain',text:'Além das geleiras, o calor das Forjas de Âmbar anunciava um novo desafio: encontrar força sem se consumir.'}
];
