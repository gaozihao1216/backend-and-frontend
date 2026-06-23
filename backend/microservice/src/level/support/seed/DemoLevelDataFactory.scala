package microservice.level.support.seed

import microservice.level.objects.core.{GameWorld, LevelData}
import microservice.level.objects.inventory.BirdInventory
import microservice.level.objects.terrain.{GroundLine, LevelEnemy, LevelObstacle, Position, Size}

/** 演示用 LevelData 构造（level 模块内，供 system seed 调用）。 */
object DemoLevelDataFactory {
  def demoLevelData: LevelData =
    LevelData(
      world = GameWorld(width = 1600, height = 900, gravity = 1.0),
      ground = Some(GroundLine(points = List(Position(0, 760), Position(1600, 760)))),
      terrain = None,
      birdInventory = BirdInventory(basic = 3),
      obstacles = List(LevelObstacle("obstacle-1", "wood", Position(960, 650), Size(120, 30), Some(0))),
      enemies = List(LevelEnemy("enemy-1", "pig", Position(1020, 610), Some(Size(48, 48))))
    )
}
