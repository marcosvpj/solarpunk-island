# Floating Islands: Survival & Recovery
## Documento de Design Completo

### Visão Geral
**Gênero**: Estratégia/Gerenciamento de Recursos com temática Solarpunk  
**Plataformas**: Web e Mobile  
**Público-Alvo**: Jogadores casuais que gostam de estratégia leve e progressão  
**Estilo Visual**: Pixel art 16 cores com grid hexagonal  
**Sessão Típica**: 5-15 minutos por partida  

## Conceito Central

### Premissa
O jogador administra uma ilha flutuante pós-apocalíptica, coletando lixo radioativo da superfície para refiná-lo em recursos úteis. O objetivo é construir uma sociedade sustentável que prospere através da reciclagem e tecnologia limpa, incarnando os ideais solarpunk de esperança, sustentabilidade e comunidade.

### Hook Principal
**"Transforme lixo em esperança"** - Cada decisão de alocação de recursos balanceia sobrevivência imediata contra crescimento de longo prazo, criando tensão constante entre risco e recompensa.

## Sistema de Grid Hexagonal

### Estrutura Espacial
- **Coordenadas Axiais**: Sistema (q, r) para posicionamento preciso
- **Adjacência**: Cada hex tem exatamente 6 vizinhos, criando oportunidades ricas para bônus de proximidade
- **Crescimento Orgânico**: Ilhas expandem em anéis hexagonais concêntricos
- **Navegação**: Drones se movem naturalmente entre hexes sem movimentos diagonais estranhos

### Vantagens do Hex
- **Estratégia Espacial**: 6 vizinhos por tile criam decisões de posicionamento mais interessantes que grids quadrados
- **Estética Natural**: Crescimento em anéis hexagonais parece orgânico e apropriado para temática solarpunk
- **Mobile-Friendly**: Hexágonos proporcionam targets de toque maiores e mais intuitivos
- **Performance**: Cálculos de distância e pathfinding mais eficientes

## Recursos Base

### Lixo Radioativo
- **Fonte**: Coletado da superfície por drones
- **Função**: Matéria-prima universal para todos os outros recursos
- **Mecânica**: Depósitos espalhados pela superfície se regeneram lentamente
- **Estratégia**: Drones devem navegar entre depósitos, criando decisões sobre eficiência de rota

### Combustível
- **Produção**: Refinado de lixo radioativo (proporção 4:3)
- **Função**: Mantém o reator funcionando (essencial para sobrevivência)
- **Consumo**: Reator base + pequena quantidade por construção ativa
- **Mecânica Critical**: Se chegar a zero, ilha cai = game over instantâneo

### Matéria-Prima
- **Produção**: Refinado de lixo radioativo (proporção 4:2)
- **Função**: Constrói novos edifícios e upgrades
- **Estratégia**: Tensão permanente entre gastar em combustível vs matéria-prima
- **Escassez**: Sempre insuficiente, força priorização constante

### População
- **Crescimento**: Limitado por habitações disponíveis e itens de luxo
- **Capacidade Base**: 5 pessoas por habitação
- **Evolução**: Habitações crescem com acesso a diferentes luxos
- **Mecânica Social**: Habitações evoluídas perto de não-evoluídas ficam infelizes (força equidade)

### Itens de Luxo
**Básicos**: Energia elétrica, água potável  
**Alimentação**: Ração proteica, vegetais, frutas  
**Culturais**: Arte, literatura, livros raros  
**Função**: Evoluem habitações, aumentam capacidade populacional

## Sistema de Construções

### Reator (Núcleo)
- **Localização**: Sempre no centro da ilha
- **Função**: Mantém a ilha flutuante + distribui energia
- **Upgrades Graduais**: Melhoram eficiência (reduzem consumo de combustível)
- **Marcos Tecnológicos**: Permitem expansão da ilha (novos anéis hexagonais)
- **Sistema de Stress**: Eficiência diminui conforme ilha aproxima da capacidade máxima
- **Visual**: 6 pontos de conexão energética para vizinhos adjacentes

### Habitações
- **Crescimento Vertical**: Evoluem visualmente de casa térrea até torres com jardins
- **Capacidade Dinâmica**: Aumenta com acesso a diferentes tipos de luxos
- **Feedback Visual**: Janelas acesas indicam população atual
- **Mecânica Social**: Pressão por igualdade entre habitações vizinhas

### Produção
**Fábrica de Drones**: Produz e repara drones  
**Refinaria de Combustível**: Lixo radioativo → combustível  
**Refinaria de Materiais**: Lixo radioativo → matéria-prima  
**Todas com**: Bônus de adjacência por posicionamento estratégico próximo ao reator/depósitos

### Agricultura & Sustentabilidade
**Coletor de Água da Chuva**: Fonte básica de água  
**Destilador de Água**: Água potável de qualidade (consome energia + lixo)  
**Fazenda de Grilo**: Ração proteica básica  
**Fazendas Hidropônicas**: Vegetais frescos  
**Estufas**: Frutas premium  

### Cultura & Bem-Estar
**Bibliotecas**: Acesso à literatura + chance de encontrar livros raros  
**Estúdios de Arte**: Produção cultural  
**Parques**: Bônus de moral para habitações vizinhas (até 6 com grid hexagonal)  
**Monumento**: Moral global + símbolo de conquista  

### Utilidade
**Depósitos**: Aumentam capacidade de armazenamento  
**Laboratórios**: Pesquisam upgrades e novas tecnologias  
**Geradores vs Painéis Solares**: Trade-off entre combustível vs sustentabilidade  

## Sistema de Drones

### Tipos Especializados
**Coletores**: Básicos, para coleta padrão de lixo  
**Carregadores Pesados**: Maior capacidade, menor velocidade  
**Exploradores**: Encontram depósitos especiais e ativam eventos raros  

### Ciclo de Vida
- **Durabilidade**: Degradam com uso ao longo do tempo
- **Manutenção**: Podem ser reparados (custa materiais)
- **Reciclagem**: Recupera parte dos materiais investidos
- **Substituição**: Planejamento constante necessário

### Navegação Hexagonal
- **Pathfinding**: A* otimizado para grid hexagonal
- **Movimentação**: 6 direções naturais, sem diagonais estranhas
- **Colisão**: Sistema de prioridade quando múltiplos drones ocupam mesmo hex
- **Feedback Visual**: Trilhas e indicadores de estado claramente visíveis

## Mecânicas de Stress

### Reator Stress
- **0-70% capacidade**: 100% eficiência
- **70-90% capacidade**: 90% eficiência  
- **90-100% capacidade**: 80% eficiência
- **Soluções**: Expansão da ilha, upgrades de eficiência, ou demolição estratégica

### Drone Overwork
- **Sintomas**: Velocidade reduzida, maior chance de quebra
- **Causas**: Muitos recursos para coletar, rotas muito longas
- **Soluções**: Mais drones, upgrades, layout mais eficiente

### Population Pressure
- **Sintomas**: Moral baixa em habitações lotadas
- **Causas**: Habitações próximas do limite + desigualdade social
- **Soluções**: Novas habitações, mais luxos, parques adjacentes

## Sistema de Turnos Híbrido

### Estrutura Temporal
- **Duração do Turno**: 30-60 segundos (configurável)
- **Tempo Real**: Simulação contínua durante o turno
- **Controles**: Pausa, 0.5x, 1x, 2x, 4x velocidade
- **Transição**: 1-2 segundos entre turnos para feedback

### Vantagens do Sistema
- **Estratégia**: Tempo para planejar durante pausas
- **Tensão**: Pressão de tempo real quando ativo
- **Acessibilidade**: Pausas naturais para interrupções mobile
- **Progressão**: Marcos claros de progresso por turno

## Sistema de Adjacência Hexagonal

### Bônus por Proximidade
**Refinarias próximas a Depósitos**: +10% eficiência  
**Refinarias próximas ao Reator**: +15% eficiência  
**Habitações próximas a Parques**: +2 capacidade por parque  
**Habitações próximas a outras Habitações**: +1 capacidade (bônus de comunidade)  
**Depósitos em localizações centrais**: +20% capacidade por 2+ vizinhos  

### Estratégias Emergentes
**Hub Central**: Depósito cercado por 6 refinarias  
**Anéis Especializados**: Produção no anel 1, habitações no anel 2  
**Radiais**: Configurações lineares irradiando do reator  

### Feedback Visual
- **Indicadores de Bônus**: +10%, +15%, +20% claramente visíveis
- **Conexões de Energia**: Linhas visuais entre construções sinérgicas
- **Highlights**: Hexágonos com adjacência positiva destacados em verde

## Eventos Aleatórios

### Eventos Negativos
**Falha do Reator**: Dobra consumo até manutenção (custa matéria-prima)  
**Rachadura nos Depósitos**: Perde 30% do combustível armazenado  
**Drone Perdido**: Drone explorador não retorna  
**Tempestade**: Reduz eficiência de coletores e painéis solares  

### Eventos Positivos
**Livros Raros**: Drones encontram literatura especial (requer biblioteca)  
**Reator Abandonado**: Descoberta permite segundo reator ou peças extras  
**Depósito Rico**: Concentração alta de lixo radioativo descoberta  
**Refugiados**: Chegam com conhecimento especial  

### Eventos de Escolha
**Comerciantes**: Trocas de recursos em taxas específicas  
**Pedido de Ajuda**: Outras comunidades pedem recursos (reputação vs recursos)  

## Progressão Entre Partidas

### Sistema de Pontos
- **Fonte**: Completar mapas + achievements específicos
- **Gasto**: Melhorias permanentes que afetam próximas partidas

### Melhorias Permanentes
**Início Aprimorado**: +3/6/9/12/15 drones iniciais  
**Eficiência**: Reator 5%/10%/15%/20%/25% mais eficiente  
**Capacidade**: +5/10/15 capacidade máxima para habitações  
**Recursos**: Bônus iniciais de combustível/materiais  
**Construção**: Começar com edifício específico já construído  

### Achievements
**Eficiência**: "Zero Waste" - reciclar 100 construções  
**População**: "Metropolis" - atingir 500+ população  
**Velocidade**: "Speed Run" - completar em tempo recorde  
**Criatividade**: "Arquiteto" - usar todas as sinergias hexagonais  
**Sobrevivência**: "Against All Odds" - 5 eventos negativos consecutivos  

## Sistema de Mapas

### Progressão de Dificuldade
**Tutorial**: Ilha pequena, recursos abundantes, eventos raros  
**Iniciante**: Introdução gradual de conceitos  
**Intermediário**: Eventos frequentes, recursos limitados  
**Avançado**: Múltiplas ilhas, comércio, mecânicas complexas  
**Expert**: Cenários específicos, desafios únicos  

### Tipos de Mapa
**Survival**: Recursos limitados, foco em eficiência máxima  
**Growth**: Espaço amplo, objetivo de população massiva  
**Tech**: Árvore tecnológica estendida, foco em pesquisa  
**Archipelago**: Múltiplas ilhas pequenas interconectadas  

### Condições de Vitória
**Variáveis por Mapa**: População + construções específicas + recursos  
**Exemplos**: 
- Atingir 200 população + construir monumento
- Estabelecer 3 ilhas funcionais
- 100% energia limpa (painéis solares apenas)
- Biblioteca com coleção completa de livros raros

## Estética e Feedback Visual

### Paleta Solarpunk
- **16 cores cuidadosamente escolhidas** para máxima expressividade
- **Crescimento orgânico** visível em construções e vegetação
- **Tecnologia integrada** com natureza
- **Esperança visual** através de cores vibrantes e vida abundante

### Princípio: Zero UI Numérica
**Tudo Visual**: Estado do jogo comunicado através de elementos gráficos  
**Exemplos**:
- Janelas acesas = população atual
- Pilhas de barris = combustível armazenado  
- Fumaça = construções ativas
- Plantas = habitações felizes
- Raios = construções com stress

### Feedback Hexagonal
**Seleção**: Outline hexagonal breathing animation  
**Hover**: Highlight sutil em branco  
**Adjacência**: Conexões visuais entre hexágonos sinérgicos  
**Progresso**: Barras hexagonais para timers e recursos  
**Estados**: Cores e efeitos específicos para cada condição  

## Especificações Técnicas

### Plataforma & Performance
**Web + Mobile**: Otimizado para ambos desde o início  
**Engine**: Canvas 2D com WebGL fallback  
**Performance**: 60 FPS desktop, 30 FPS mobile  
**Limites**: 50 construções, 20 drones, 100 partículas simultâneas  

### Sistema de Coordenadas Hexagonais
**Axial (q, r)**: Sistema mais prático para desenvolvimento  
**Conversões**: Pixel ↔ Hex ↔ Cube coordinates  
**Pathfinding**: A* otimizado para grids hexagonais  
**Vizinhança**: 6 direções pré-calculadas para performance  

### Salvamento & Persistência
**LocalStorage**: Web browser  
**Platform Storage**: Mobile nativo  
**Cloud Sync**: Opcional para progressão entre dispositivos  
**Format**: JSON compacto com versionamento  

## Desenvolvimento em Fases

### Fase 1: MVP Core (2-3 semanas)
**Objetivo**: Provar que o loop de sobrevivência é viciante  
**Features**: Ilha 7-hex, reator, 3 habitações, 1 drone, sistema de turnos básico  
**Sucesso**: Taxa de retry 80%+, jogadores querem "só mais uma"  

### Fase 2: Economia de Recursos (2-3 semanas)
**Objetivo**: Transformar sobrevivência em gestão estratégica  
**Features**: Refinarias, depósitos, construção, bônus de adjacência  
**Sucesso**: Múltiplas estratégias viáveis, decisões difíceis constantes  

### Fase 3: Inteligência dos Drones (2-3 semanas)
**Objetivo**: Adicionar profundidade através de especialização  
**Features**: Pathfinding real, tipos de drone, durabilidade, territórios  
**Sucesso**: Gestão de drones torna-se mini-game interessante  

### Fase 4: Dinâmicas Populacionais (2-3 semanas)
**Objetivo**: Elementos sociais e progressão de habitação  
**Features**: Itens de luxo, evolução de habitações, moral, parques  
**Sucesso**: Crescimento populacional sente-se recompensador  

### Fase 5: Sistemas de Expansão (3-4 semanas)
**Objetivo**: Escala e complexidade de longo prazo  
**Features**: Expansão de ilha, múltiplas ilhas, árvore de pesquisa  
**Sucesso**: Jogadores engajados por 20+ partidas  

### Fase 6: Meta-Progressão (2-3 semanas)
**Objetivo**: Retenção de longo prazo  
**Features**: Mapas múltiplos, achievements, melhorias permanentes  
**Sucesso**: Jogadores retornam consistentemente por semanas  

## Pipeline de Arte

### Produção de Assets
**Semana 1**: 8 sprites críticos para MVP funcional  
**Semana 2**: 40+ sprites para economia de recursos  
**Semana 3**: 60+ sprites para sistemas avançados  
**Semana 4**: Polish e refinamento visual  

### Especificações
**Total**: ~150 sprites individuais  
**Atlas**: 1 master (1024×1024) + 2 overflow (512×512)  
**Formato**: PNG indexado, 16 cores, sem suavização  
**Animações**: JSON metadata para timing e loops  

## Balanceamento Econômico

### Recursos Chave
**Drone Collection**: 12 unidades a cada 3 turnos  
**Fuel Consumption**: 6 por turno (base) + 0.5 por construção  
**Refinery Ratios**: Combustível 4:3, Materiais 4:2  
**Adjacency Bonuses**: 10-25% dependendo da sinergia  

### Condições de Vitória/Derrota
**Derrota**: Combustível = 0 (instantâneo)  
**Vitória**: Variável por mapa, tipicamente 15-20 turnos  
**Taxa de Sucesso Alvo**: 40-60% com estratégia balanceada  

## Monetização & Distribuição

### Modelo Free-to-Play
**Core Game**: Completamente grátis  
**Premium Skins**: Pacotes visuais temáticos  
**Map Packs**: Cenários adicionais  
**No Pay-to-Win**: Apenas cosmético e conteúdo adicional  

### Platforms
**Primário**: Web (itch.io, próprio site)  
**Secundário**: Mobile stores (Android/iOS)  
**Marketing**: Comunidades de indie games, solarpunk, pixel art  

## Métricas de Sucesso

### Engajamento
**Session Length**: 5-15 minutos médio  
**Retry Rate**: 70%+ após primeira partida  
**Retention**: 30% retornam após 1 semana  
**Progression**: 50% completam pelo menos 5 mapas  

### Qualidade
**Performance**: Mantém target FPS em dispositivos low-end  
**Accessibility**: Jogável por usuários com daltonismo  
**Learning Curve**: Tutorial < 5 minutos, mastery > 10 horas  

---

## Resumo Executivo

**Floating Islands: Survival & Recovery** é um jogo de estratégia hexagonal que combina gestão de recursos tática com planejamento espacial estratégico. O sistema de grid hexagonal cria oportunidades únicas para adjacência e crescimento orgânico, enquanto a temática solarpunk oferece uma narrativa esperançosa de renovação através da sustentabilidade.

O híbrido tempo real/turnos balanceia acessibilidade mobile com profundidade estratégica. A progressão entre partidas e variedade de mapas garantem replayability, enquanto o feedback visual integrado minimiza dependência de UI complexa.

Com desenvolvimento em 6 fases bem definidas e pipeline de arte otimizado, o projeto pode ser entregue em 16-20 semanas com uma equipe pequena, resultando em um produto distintivo que preenche um nicho único no mercado de jogos mobile estratégicos.