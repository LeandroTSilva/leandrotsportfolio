<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function resp(int $code, array $body): never { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') resp(405, ['ok'=>false,'erro'=>'metodo']);

$cfg = require __DIR__ . '/config.php';

if ($cfg['origens']) {
    $o = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($o !== '' && !in_array($o, $cfg['origens'], true)) resp(403, ['ok'=>false,'erro'=>'origem']);
}

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) resp(413, ['ok'=>false,'erro'=>'grande']);
$in = json_decode($raw, true);
if (!is_array($in)) resp(400, ['ok'=>false,'erro'=>'json']);

// Armadilha para robôs: o campo "site" fica escondido; se vier preenchido, finge sucesso e descarta.
if (!empty($in['site'])) resp(200, ['ok'=>true]);

function limpa($v, int $max): string {
    $v = is_string($v) ? trim($v) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}
$d = [
    'nome'     => limpa($in['nome'] ?? '', 120),
    'email'    => limpa($in['email'] ?? '', 160),
    'empresa'  => limpa($in['empresa'] ?? '', 160),
    'whatsapp' => limpa($in['whatsapp'] ?? '', 40),
    'onde_estao_os_dados' => limpa($in['onde_estao_os_dados'] ?? '', 40),
    'desafio'  => limpa($in['desafio'] ?? '', 3000),
];
if ($d['nome']==='' || $d['desafio']==='' || $d['onde_estao_os_dados']==='' || !filter_var($d['email'], FILTER_VALIDATE_EMAIL)) {
    resp(422, ['ok'=>false,'erro'=>'validacao']);
}
if (empty($in['consentimento'])) resp(422, ['ok'=>false,'erro'=>'consentimento']);

$dir = dirname(__DIR__) . '/storage';
if (!is_dir($dir)) mkdir($dir, 0750, true);

// Limite simples por IP (arquivo)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$rl = $dir . '/rate.json';
$fh = fopen($rl, 'c+');
if ($fh && flock($fh, LOCK_EX)) {
    $j = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
    $agora = time(); $k = hash('sha256', $ip);
    $j[$k] = array_values(array_filter($j[$k] ?? [], fn($t)=>$t > $agora-3600));
    if (count($j[$k]) >= (int)$cfg['limite_por_hora']) { flock($fh, LOCK_UN); fclose($fh); resp(429, ['ok'=>false,'erro'=>'limite']); }
    $j[$k][] = $agora;
    foreach ($j as $kk=>$ts) { $j[$kk] = array_values(array_filter($ts, fn($t)=>$t > $agora-3600)); if(!$j[$kk]) unset($j[$kk]); }
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($j)); fflush($fh); flock($fh, LOCK_UN);
}
if ($fh) fclose($fh);

// 1) Salva sempre primeiro (uma linha JSON por lead)
$registro = $d + ['recebido_em'=>date('c'), 'origem'=>limpa($in['origem'] ?? '', 40), 'ip_hash'=>substr(hash('sha256', $ip),0,16)];
$salvou = file_put_contents($dir.'/leads.jsonl', json_encode($registro, JSON_UNESCAPED_UNICODE)."\n", FILE_APPEND | LOCK_EX) !== false;

// 2) Avisa por e-mail
$ass = '=?UTF-8?B?'.base64_encode('Novo lead do portfólio: '.$d['nome']).'?=';
$corpo = "Novo contato pelo site\r\n\r\n"
  ."Nome: {$d['nome']}\r\nE-mail: {$d['email']}\r\nEmpresa: {$d['empresa']}\r\nWhatsApp: {$d['whatsapp']}\r\n"
  ."Onde estão os dados: {$d['onde_estao_os_dados']}\r\n\r\nDecisão a apoiar:\r\n{$d['desafio']}\r\n\r\nRecebido em ".date('d/m/Y H:i')."\r\n";
$h = "From: {$cfg['remetente']}\r\nReply-To: ".str_replace(["\r","\n"],'',$d['email'])."\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
$enviou = @mail($cfg['destino'], $ass, $corpo, $h);

if (!$salvou && !$enviou) resp(500, ['ok'=>false,'erro'=>'falha']);
resp(200, ['ok'=>true]);
