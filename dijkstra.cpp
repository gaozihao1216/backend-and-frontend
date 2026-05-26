#include <iostream>
#include <limits>
#include <queue>
#include <utility>
#include <vector>

using namespace std;

vector<int> dijkstra(int start, const vector<vector<pair<int, int>>>& graph) {
    const int INF = numeric_limits<int>::max();
    vector<int> dist(graph.size(), INF);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        int currentDist = pq.top().first;
        int node = pq.top().second;
        pq.pop();

        if (currentDist > dist[node]) {
            continue;
        }

        for (const auto& edge : graph[node]) {
            int neighbor = edge.first;
            int weight = edge.second;

            if (dist[node] + weight < dist[neighbor]) {
                dist[neighbor] = dist[node] + weight;
                pq.push({dist[neighbor], neighbor});
            }
        }
    }

    return dist;
}

int main() {
    int vertices = 5;
    vector<vector<pair<int, int>>> graph(vertices);

    graph[0].push_back({1, 10});
    graph[0].push_back({2, 3});
    graph[1].push_back({2, 1});
    graph[1].push_back({3, 2});
    graph[2].push_back({1, 4});
    graph[2].push_back({3, 8});
    graph[2].push_back({4, 2});
    graph[3].push_back({4, 7});
    graph[4].push_back({3, 9});

    int start = 0;
    vector<int> distances = dijkstra(start, graph);

    cout << "Shortest distances from node " << start << ":\n";
    for (int i = 0; i < vertices; ++i) {
        cout << "To node " << i << ": " << distances[i] << '\n';
    }

    return 0;
}
