// app.js
const POKEMON_COUNT = 12;
// Tipo fixado no código, simplificando o processo de busca inicial
const TIPO_FIXO = 'Fire'; // A API espera o nome em inglês
const POKE_API_BASE = 'https://pokeapi.co/api/v2/';

/**
 * Função utilitária para criar o cartão HTML de um Pokémon.
 */
function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';

    const abilitiesHtml = pokemon.habilidades.length > 0
        ? `<li>Habilidades: ${pokemon.habilidades.join(', ')}</li>` // Lista de habilidades ou N/A  
        : '<li>Habilidades: N/A</li>';

    card.innerHTML = `
        <img src="${pokemon.imagem}" alt="${pokemon.nome}">
        <h3>${pokemon.nome}</h3>
        
        <ul class="stats-list">
            <li>Peso: ${pokemon.peso} kg</li>
            <li>Altura: ${pokemon.altura} m</li>
            ${abilitiesHtml}
            <li>Ataque: ${pokemon.ataque}</li>
            <li>Defesa: ${pokemon.defesa}</li>
        </ul>
    `;
    return card;
}

/**
 * Função principal assíncrona que consome a API e manipula o DOM.
 */
async function loadFixedTypePokemons() {
    const listContainer = document.getElementById('pokemon-list');

    // 1. Inicia o bloco de segurança obrigatório: TRY...CATCH
    try {
        // --- 2. CONSUMO DA API: Passo 1 (Lista de URLs) ---
        const typeUrl = `${POKE_API_BASE}type/${TIPO_FIXO}`;
        let response = await fetch(typeUrl);

        if (!response.ok) {
            throw new Error(`Falha ao buscar a lista de tipos. Status: ${response.status}`);
        }

        const typeData = await response.json();

        // Limita a lista aos 12 primeiros
        const pokemonUrls = typeData.pokemon
            .slice(0, POKEMON_COUNT) // Pega apenas os 12 primeiros itens   
            .map(item => item.pokemon.url); // Extrai a URL de cada Pokémon 

        // --- 3. CONSUMO DA API: Passo 2 (Detalhes de cada Pokémon) ---
        const detalhesPromises = pokemonUrls.map(async (url) => {
            // AQUI OCORRE A SEGUNDA CHAMADA COM NOVO TRY/CATCH IMPLÍCITO PELO AWAIT
            const res = await fetch(url);
            if (!res.ok) {
                // Se um único fetch falhar, lançamos um erro customizado.
                throw new Error(`Falha ao buscar detalhes do Pokémon em ${url}`);
            }
            return res.json();
        });

        // Espera que todas as 12 chamadas de detalhe terminem
        const resultadosDetalhados = await Promise.all(detalhesPromises);

        // --- 4. PROCESSAMENTO E EXIBIÇÃO NO DOM ---
        listContainer.innerHTML = ''; // Limpa a mensagem de carregamento

        resultadosDetalhados.forEach(data => {
            // Processa o objeto JSON complexo da API para um objeto limpo
            const pokemon = {
                nome: data.name,
                imagem: data.sprites.other["official-artwork"].front_default || data.sprites.front_default,
                peso: data.weight / 10,
                altura: data.height / 10,
                habilidades: data.abilities.slice(0, 2).map(a => a.ability.name),  // Pega até 2 habilidades    
                ataque: data.stats.find(s => s.stat.name === 'attack')?.base_stat || 'N/A',  // Pega o valor de ataque  
                defesa: data.stats.find(s => s.stat.name === 'defense')?.base_stat || 'N/A'  // Pega o valor de defesa  
            };

            // Cria o cartão e insere no container
            const card = createPokemonCard(pokemon);
            listContainer.appendChild(card);
        });

    } catch (error) {
        // O CATCH OBRIGATÓRIO: Captura qualquer falha em todo o processo
        console.error("ERRO CRÍTICO NO CARREGAMENTO DA API:", error);
        listContainer.innerHTML = `<p class="error-message">❌ Não foi possível carregar os Pokémon. ${error.message}</p>`;
    }
}

// Inicia o processo quando o HTML termina de carregar
document.addEventListener('DOMContentLoaded', loadFixedTypePokemons);