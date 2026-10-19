<?php
// Configuração do recebimento de leads. Ajuste ao subir para a hospedagem real.
return [
    'destino'      => 'leandro90ads@gmail.com',      // quem recebe o e-mail
    // Remetente: em hospedagem real use um e-mail do seu domínio (ex.: contato@seudominio.com.br),
    // senão o Gmail/Outlook costuma mandar para o spam.
    'remetente'    => 'nao-responda@localhost',
    'origens'      => [],                              // domínios permitidos (vazio = qualquer). Ex.: ['https://seudominio.com.br']
    'limite_por_hora' => 5,                            // envios por IP por hora
];
