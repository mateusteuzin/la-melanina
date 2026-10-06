import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conflicts, monthlySummary, validateBooking, seedServices } from '../src/admin/domain.ts';

const appointment = { id:'a', name:'Ana', phone:'', serviceId:'duplo', serviceName:'Bronze Duplo', date:'2026-10-07', time:'09:00', duration:120, category:'cabine', amount:145, status:'confirmado', notes:'', addons:[], payments:[{id:'p',amount:50,date:'2026-09-30',method:'Pix'}], history:[], createdAt:'' } as any;
test('reserva de duas horas impede sobreposição e libera o horário final', () => {
 assert.equal(conflicts([appointment], [], {...appointment,id:'b',time:'10:00',duration:45}), true);
 assert.equal(conflicts([appointment], [], {...appointment,id:'b',time:'11:00',duration:45}), false);
});
test('cancelamento libera vaga; natural usa um recurso independente', () => {
 assert.equal(conflicts([{...appointment,status:'cancelado'}], [], {...appointment,id:'b'}), false);
 assert.equal(conflicts([appointment], [], {...appointment,id:'b',category:'natural',time:'Manhã (08h-11h)'}), false);
});
test('bloqueio do dia inteiro impede reservas', () => {
 assert.equal(conflicts([], [{id:'x',date:'2026-10-07',time:'dia',reason:'Folga'}], appointment), true);
});
test('financeiro atribui recebimento ao mês do pagamento e ignora previsão cancelada', () => {
 const result = monthlySummary([appointment,{...appointment,id:'c',status:'cancelado',payments:[]}], '2026-10');
 assert.equal(result.received, 0); assert.equal(result.expected,95);
 assert.equal(monthlySummary([appointment],'2026-09').received,50);
});
test('valida nome, data real, segunda-feira fechada e horários permitidos', () => {
 assert.throws(() => validateBooking({...appointment,name:''},seedServices), /nome/i);
 assert.throws(() => validateBooking({...appointment,date:'2026-02-31'},seedServices), /data/i);
 assert.throws(() => validateBooking({...appointment,date:'2026-10-12'},seedServices), /segunda/i);
 assert.throws(() => validateBooking({...appointment,time:'03:00'},seedServices), /horário/i);
});
test('bronze natural aceita chegadas às 08:10 e 09:35 e rejeita períodos antigos', () => {
 const natural={...appointment,serviceId:'bronze-turbo',category:'natural',time:'08:10'} as any;
 assert.doesNotThrow(()=>validateBooking(natural,seedServices));
 assert.doesNotThrow(()=>validateBooking({...natural,time:'09:35'},seedServices));
 assert.throws(()=>validateBooking({...natural,time:'Manhã (08h-11h)'},seedServices),/Horário/);
 assert.equal(conflicts([natural],[],{...natural,id:'b',time:'08:15'}),false);
 assert.equal(conflicts([natural],[],{...natural,id:'b'}),true);
});
