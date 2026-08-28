import { PropertyLink, syncDatabase } from '../models/index.js';

const deleteRemaxLinks = async () => {
    try {
        await syncDatabase();
        
        const deletedCount = await PropertyLink.destroy({
            where: {
                source: 'remax'
            }
        });
        
        console.log(`Se eliminaron ${deletedCount} links de Remax de la base de datos.`);
        process.exit(0);
    } catch (error) {
        console.error('Error al eliminar links de Remax:', error);
        process.exit(1);
    }
};

deleteRemaxLinks();